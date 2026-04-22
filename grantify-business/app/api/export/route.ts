import { NextRequest } from 'next/server';
import { generateDocx } from '@/lib/export';
import { ApplicationSection } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const sections: ApplicationSection[] = body?.sections ?? [];
  const clientName: string = body?.clientName ?? 'Client';
  const grantName: string = body?.grantName ?? 'Grant Application';

  if (!sections.length) {
    return new Response('sections array is required', { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await generateDocx({ sections, clientName, grantName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    return new Response(msg, { status: 500 });
  }

  const filename = `${clientName} - ${grantName}.docx`
    .replace(/[/\\?%*:|"<>]/g, '-')
    .slice(0, 200);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  });
}
