import { NextRequest, NextResponse } from 'next/server';

// Increase body size limit for file uploads
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const filename = file.name;
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext !== 'pdf' && ext !== 'docx') {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload a PDF or DOCX.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = '';

  try {
    if (ext === 'pdf') {
      // Use direct module path to bypass pdf-parse's test-file initialisation
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text ?? '';
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value ?? '';
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  if (!cleaned) {
    return NextResponse.json(
      { error: 'No readable text found in this file.' },
      { status: 422 }
    );
  }

  return NextResponse.json({ filename, text: cleaned, type: ext });
}
