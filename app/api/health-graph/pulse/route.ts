import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { updateGraphFromPulse } from "@/lib/healthGraph";
import type { HealthPulseLog } from "@/lib/userContext";

const MAX_BODY_BYTES = 16_384; // 16 KB is generous for a pulse log
const MAX_BACKDATE_DAYS = 7;     // Grace period max from P1.2

export async function POST(req: Request) {
  // ADDED — body size guard
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
    if (!idToken) {
      return NextResponse.json({ error: "Authentication token missing." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const body = await req.json().catch(() => ({}));

    // ADDED — read patternNote posted by HealthPulse P0.3
    const patternNote = typeof body?.patternNote === "string" ? body.patternNote.slice(0, 500) : undefined;

    const raw = body?.log as HealthPulseLog | undefined;

    // ADDED — validate required fields
    if (!raw?.date || typeof raw.wellnessScore !== "number") {
      return NextResponse.json({ error: "Valid HealthPulse log required." }, { status: 400 });
    }

    // ADDED — validate wellness score range
    if (raw.wellnessScore < 1 || raw.wellnessScore > 10) {
      return NextResponse.json({ error: "wellnessScore must be between 1 and 10." }, { status: 400 });
    }

    // ADDED — validate date is not in the future or more than MAX_BACKDATE_DAYS old
    const logDate = new Date(raw.date + "T00:00:00Z");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const diffDays = (today.getTime() - logDate.getTime()) / 86_400_000;
    if (isNaN(diffDays) || diffDays < 0 || diffDays > MAX_BACKDATE_DAYS) {
      return NextResponse.json(
        { error: `Date must be today or within the last ${MAX_BACKDATE_DAYS} days.` },
        { status: 400 }
      );
    }

    // ADDED — strip uid from the log body (body.uid is ignored; decoded.uid is authoritative)
    const { id: _id, ...logWithoutId } = raw as any;

    const log: Omit<HealthPulseLog, "id"> = {
      date: raw.date,
      wellnessScore: Math.round(raw.wellnessScore), // normalise to integer
      bodySymptoms: Array.isArray(raw.bodySymptoms) ? raw.bodySymptoms : [],
      mindSymptoms: Array.isArray(raw.mindSymptoms) ? raw.mindSymptoms : [],
      symptomIntensity: raw.symptomIntensity ?? {},
      note: typeof raw.note === "string" ? raw.note.slice(0, 1000) : undefined,
      createdAt: raw.createdAt || new Date().toISOString(),
    };

    await updateGraphFromPulse(decoded.uid, log);

    // ADDED — write patternNote to health graph document if provided
    if (patternNote) {
      try {
        await getAdminDb()
          .collection("users")
          .doc(decoded.uid)
          .set(
            { healthGraph: { patternNote } },
            { merge: true }
          );
      } catch {
        // best-effort — patternNote write failure doesn't fail the request
      }
    }

    // FIXED — return minimal acknowledgement, not the full graph
    return NextResponse.json({ ok: true, date: log.date });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}