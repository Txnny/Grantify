import { interviewSystemPrompt } from '@/lib/prompts';
import { BusinessProfile, ConversationMessage } from '@/lib/types';

const MAX_GRANT_CHARS = 3000;
const MAX_HISTORY = 8;
const FAST_MODEL = 'claude-haiku-4-5-20251001';

export const runtime = 'edge';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const grantText: string = (body?.grantText ?? '').slice(0, MAX_GRANT_CHARS);
  const clientProfile: BusinessProfile | null = body?.clientProfile ?? null;
  const conversationHistory: ConversationMessage[] =
    (body?.conversationHistory ?? []).slice(-MAX_HISTORY);

  if (!grantText || !clientProfile) {
    return new Response('grantText and clientProfile are required', { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY is not configured', { status: 500 });
  }

  const system = interviewSystemPrompt(grantText, clientProfile);

  const messages: { role: 'user' | 'assistant'; content: string }[] =
    conversationHistory.length === 0
      ? [{ role: 'user', content: 'Begin the interview with your first question.' }]
      : conversationHistory.map((m) => ({ role: m.role, content: m.content }));

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
        model: FAST_MODEL,
        max_tokens: 512,
        stream: true,
        system,
        messages,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`__ERROR__${msg}`, { status: 500 });
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

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`__ERROR__${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
