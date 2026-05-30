import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { getAdminAuth, getAdminDb, firebaseAdmin } from '@/lib/firebaseAdmin';
import { analyzeMedicalDocument } from '@/lib/intelligence';

function extractPdfTextBestEffort(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const literalStrings = [...raw.matchAll(/\(([^()]{3,})\)/g)]
    .map((match) => match[1])
    .join(' ');
  const normalized = literalStrings
    .replace(/\\n|\\r/g, ' ')
    .replace(/\\\(|\\\)/g, (value) => value.slice(1))
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    ? `${normalized}\n\nNote: PDF text was extracted with a best-effort built-in parser. Scanned or compressed PDFs require OCR/PDF parsing for complete analysis.`
    : '';
}

function extractDocumentText(buffer: Buffer, file: File, fileName: string): string {
  const lowerName = fileName.toLowerCase();
  const mime = file.type.toLowerCase();

  if (
    mime.startsWith('text/') ||
    mime.includes('json') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.json')
  ) {
    return buffer.toString('utf8');
  }

  if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return extractPdfTextBestEffort(buffer);
  }

  if (mime.startsWith('image/')) {
    return 'Image upload received. OCR is not configured yet, so NOVA cannot read text from this image. Add OCR or a vision model before relying on image-based report analysis.';
  }

  return '';
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;

    if (!idToken) {
      return NextResponse.json({ error: 'Authentication token missing.' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const fileName = formData.get('fileName')?.toString() || file.name || `upload-${Date.now()}`;
    const fileType = formData.get('type')?.toString() || 'medical-document';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const filePath = `medicalVault/${userId}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const documentText = extractDocumentText(buffer, file, fileName);

    const bucket = firebaseAdmin.storage().bucket();
    const storageFile = bucket.file(filePath);

    await storageFile.save(buffer, {
      contentType: file.type || 'application/octet-stream',
      resumable: false,
    });

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const [signedUrl] = await storageFile.getSignedUrl({
      action: 'read',
      expires: expiresAt,
    });

    const analysis = await analyzeMedicalDocument(documentText, fileName);
    const record = {
      userId,
      name: fileName,
      size: `${(buffer.byteLength / (1024 * 1024)).toFixed(1)} MB`,
      type: fileType,
      status: 'complete',
      result: analysis,
      ext,
      url: signedUrl,
      storagePath: filePath,
      createdAt: new Date(),
    };

    const docRef = await getAdminDb().collection('medicalVault').add(record);

    return NextResponse.json({ id: docRef.id, ...record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
