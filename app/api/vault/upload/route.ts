import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { v2 as cloudinary } from "cloudinary";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { analyzeMedicalDocument } from "@/lib/intelligence";
import { updateGraphFromVault } from "@/lib/healthGraph";
import type { AnalysisResult } from "@/lib/intelligence";

// Configure Cloudinary once at module load
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// Configurable limits
const MAX_FILE_BYTES = parseInt(process.env.NOVA_VAULT_MAX_FILE_BYTES ?? String(20 * 1024 * 1024), 10); // 20 MB

// ADDED — allowed MIME types and extensions
const ALLOWED_MIME_PREFIXES = ["application/pdf", "image/", "text/"];
const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp", "txt", "csv", "md", "json", "dcm"]);

type Marker = { name: string; value: number; unit?: string; status?: string };
type ReportComparison = {
  currentId?: string;
  previousId: string;
  reportType: string;
  currentDate: string;
  previousDate: string;
  rows: {
    marker: string;
    previous: number;
    current: number;
    unit?: string;
    change: number;
    direction: "up" | "down" | "flat";
    status: string;
  }[];
  notTestedThisTime: string[];
  interpretation: string;
};

function extractPdfTextBestEffort(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const literalStrings = [...raw.matchAll(/\(([^()]{3,})\)/g)]
    .map((m) => m[1])
    .join(" ");
  const normalized = literalStrings
    .replace(/\\n|\\r/g, " ")
    .replace(/\\\(|\\\)/g, (v) => v.slice(1))
    .replace(/\s+/g, " ")
    .trim();
  return normalized
    ? `${normalized}\n\nNote: PDF text was extracted with a best-effort built-in parser. Scanned or compressed PDFs require OCR for complete analysis.`
    : "";
}

function extractDocumentText(buffer: Buffer, file: File, fileName: string): string {
  const lowerName = fileName.toLowerCase();
  const mime = file.type.toLowerCase();

  if (
    mime.startsWith("text/") || mime.includes("json") ||
    lowerName.endsWith(".txt") || lowerName.endsWith(".csv") ||
    lowerName.endsWith(".md") || lowerName.endsWith(".json")
  ) {
    return buffer.toString("utf8");
  }
  if (mime === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractPdfTextBestEffort(buffer);
  }
  if (mime.startsWith("image/")) {
    return "Image upload received. OCR is not configured yet — NOVA cannot read text from this image.";
  }
  return "";
}

function markerKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatUploadDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  if (value && typeof value === "object" && "toDate" in value && typeof (value as any).toDate === "function") {
    return (value as any).toDate().toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function buildComparison(
  current: AnalysisResult,
  previousRecord: FirebaseFirestore.DocumentData
): ReportComparison | null {
  const currentMarkers = current.markers ?? [];
  const previous = previousRecord.result as AnalysisResult | undefined;
  const previousMarkers = previous?.markers ?? [];
  if (currentMarkers.length === 0 || previousMarkers.length === 0) return null;

  const previousByKey = new Map(previousMarkers.map((m) => [markerKey(m.name), m]));
  const currentKeys = new Set(currentMarkers.map((m) => markerKey(m.name)));
  const rows: ReportComparison["rows"] = [];

  for (const marker of currentMarkers) {
    const prev = previousByKey.get(markerKey(marker.name));
    if (!prev) continue;
    const change = Number((marker.value - prev.value).toFixed(2));
    const direction = Math.abs(change) < 0.01 ? "flat" : change > 0 ? "up" : "down";
    const magnitude = Math.abs(change);
    const status =
      marker.status?.toLowerCase().includes("high") || marker.status?.toLowerCase().includes("low")
        ? "Monitor"
        : magnitude > Math.max(1, Math.abs(prev.value) * 0.2)
          ? "Changed"
          : "Stable";
    rows.push({ marker: marker.name, previous: prev.value, current: marker.value, unit: marker.unit || prev.unit, change, direction, status });
  }

  if (!rows.length) return null;

  const notTestedThisTime = previousMarkers
    .filter((m) => !currentKeys.has(markerKey(m.name)))
    .map((m) => m.name)
    .slice(0, 8);

  const watchRows = rows.filter((r) => r.status !== "Stable").slice(0, 3);
  const improvedRows = rows.filter((r) => r.status === "Stable" && r.direction !== "flat").slice(0, 2);
  const interpretation = [
    watchRows.length
      ? `NOVA noticed meaningful movement in ${watchRows.map((r) => r.marker).join(", ")}. These changes are worth discussing with your doctor.`
      : `NOVA did not find major movement across shared markers. Values look broadly stable.`,
    improvedRows.length
      ? `Some markers shifted modestly (${improvedRows.map((r) => r.marker).join(", ")}), but direction alone is not diagnostic.`
      : "",
    "This analysis is for informational context only. Always discuss results with your doctor.",
  ].filter(Boolean).join(" ");

  return {
    previousId: previousRecord.id,
    reportType: current.type,
    currentDate: new Date().toISOString().slice(0, 10),
    previousDate: formatUploadDate(previousRecord.createdAt),
    rows,
    notTestedThisTime,
    interpretation,
  };
}

export async function POST(req: Request) {
  try {
    // FIXED — consistent token extraction
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
    if (!idToken) {
      return NextResponse.json({ error: "Authentication token missing." }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Invalid authentication token." }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // ADDED — file size check before buffering
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.` },
        { status: 413 }
      );
    }

    const fileName = formData.get("fileName")?.toString() || file.name || `upload-${Date.now()}`;
    const fileType = formData.get("type")?.toString() || "medical-document";
    const ext = fileName.split(".").pop()?.toLowerCase() || "pdf";

    // ADDED — file type allowlist
    const mimeAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => file.type.toLowerCase().startsWith(prefix));
    const extAllowed = ALLOWED_EXTENSIONS.has(ext);
    if (!mimeAllowed || !extAllowed) {
      return NextResponse.json(
        { error: "File type not supported. Please upload a PDF, image, or text document." },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const documentText = extractDocumentText(buffer, file, fileName);

    // ADDED — skip LLM analysis for files with no extractable text
    let analysis: AnalysisResult;
    if (!documentText.trim() || documentText.startsWith("Image upload received")) {
      analysis = {
        type: fileType,
        findings: ["No text could be extracted from this file. NOVA cannot analyse it automatically."],
        riskLevel: "low",
        recommendations: ["Upload a text-based PDF or share the relevant values in chat."],
        markers: [],
      };
    } else {
      analysis = await analyzeMedicalDocument(documentText, fileName);
    }

    // ── Upload to Cloudinary ───────────────────────────────────────────────
    // Use upload_stream so we never write to disk — stream the buffer directly
    const publicId = `medicalVault/${userId}/${Date.now()}`;
    const resourceType = file.type.startsWith("image/") ? "image" : "raw";

    const cloudinaryResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: resourceType,
            folder: "nova_vault",
            // Tag with userId so assets are easy to find/delete per user
            tags: [`user_${userId}`],
            // Keep original filename in the context metadata
            context: { original_name: fileName, user_id: userId },
          },
          (err, result) => {
            if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        uploadStream.end(buffer);
      }
    );

    const fileUrl = cloudinaryResult.secure_url;
    const storagePath = cloudinaryResult.public_id;

    // ADDED — try previous-report comparison; catch index errors gracefully
    let previousDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    try {
      const previousSnapshot = await getAdminDb()
        .collection("medicalVault")
        .where("userId", "==", userId)
        .where("result.type", "==", analysis.type)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      previousDoc = previousSnapshot.empty ? null : previousSnapshot.docs[0];
    } catch {
      // Composite index may not exist yet — comparison skipped gracefully
      previousDoc = null;
    }

    const comparison = previousDoc
      ? buildComparison(analysis, { id: previousDoc.id, ...previousDoc.data() })
      : null;

    // ADDED — initialise discussedWithNOVA: false so dashboard filter works
    const record = {
      userId,
      name: fileName,
      size: `${(buffer.byteLength / (1024 * 1024)).toFixed(1)} MB`,
      type: fileType,
      status: "complete",
      result: analysis,
      comparison,
      ext,
      url: fileUrl,
      storagePath,
      createdAt: new Date(),
      discussedWithNOVA: false,
    };

    const docRef = await getAdminDb().collection("medicalVault").add(record);

    if (comparison) {
      await docRef.update({ "comparison.currentId": docRef.id }).catch(() => { });
    }

    await updateGraphFromVault(userId, {
      fileName,
      type: analysis.type || fileType,
      riskLevel: analysis.riskLevel,
      findings: Array.isArray(analysis.findings) ? analysis.findings : [],
      uploadedAt: record.createdAt.toISOString(),
    }).catch(() => { });

    // FIXED — return only client-safe fields, not storagePath or internal metadata
    return NextResponse.json({
      id: docRef.id,
      name: record.name,
      size: record.size,
      type: record.type,
      status: record.status,
      result: record.result,
      comparison: comparison ? { ...comparison, currentId: docRef.id } : null,
      ext: record.ext,
      url: record.url,
      createdAt: record.createdAt.toISOString(),
      discussedWithNOVA: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}