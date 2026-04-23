import { draftSystemPrompt } from '@/lib/prompts';
import { ClientProfile, ConversationMessage } from '@/lib/types';

export const maxDuration = 60;

const MAX_GRANT_CHARS = 12000;
const MAX_CONV_MESSAGES = 30;
const MODEL = 'claude-haiku-4-5-20251001';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const grantText: string = (body?.grantText ?? '').slice(0, MAX_GRANT_CHARS);
  const clientProfile: ClientProfile | null = body?.clientProfile ?? null;
  const conversation: ConversationMessage[] = (body?.conversation ?? []).slice(-MAX_CONV_MESSAGES);

  if (!grantText || !clientProfile) {
    return new Response(
      JSON.stringify({ error: 'grantText and clientProfile are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const system = draftSystemPrompt(grantText, clientProfile, conversation);

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        stream: true,
        system,
        messages: [
          { role: 'user', content: 'Generate the complete grant application now.' },
        ],
      }),
    });
  } catch (err) {
    const cls = err?.constructor?.name ?? 'UnknownError';
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`__ERROR__[${cls}] ${msg}`, { status: 500 });
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text().catch(() => '');
    return new Response(`__ERROR__Anthropic error ${anthropicRes.status}: ${errText.slice(0, 300)}`, {
      status: 500,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta' &&
                typeof event.delta.text === 'string'
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              } else if (event.type === 'error') {
                const errMsg = event.error?.message ?? 'API stream error';
                controller.enqueue(encoder.encode(`__ERROR__${errMsg}`));
                controller.close();
                return;
              }
            } catch {
              // skip malformed SSE line
            }
          }
        }

        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            try {
              const event = JSON.parse(data);
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta' &&
                typeof event.delta.text === 'string'
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              } else if (event.type === 'error') {
                const errMsg = event.error?.message ?? 'API stream error';
                controller.enqueue(encoder.encode(`__ERROR__${errMsg}`));
                controller.close();
                return;
              }
            } catch { /* ignore */ }
          }
        }

        controller.close();
      } catch (err) {
        const cls = err?.constructor?.name ?? 'UnknownError';
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n__ERROR__[${cls}] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
