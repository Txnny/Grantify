import { NextRequest } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';
import { draftSystemPrompt } from '@/lib/prompts';
import { ClientProfile, ConversationMessage } from '@/lib/types';

// Streaming keeps the connection alive past Vercel Hobby's 10s function timeout
// (streaming duration = 25s on Hobby, 300s on Pro)
export const maxDuration = 60;

const MAX_GRANT_CHARS = 12000; // truncate very long grant docs
const MAX_CONV_MESSAGES = 30;  // keep last 30 messages

export async function POST(req: NextRequest) {
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

  const system = draftSystemPrompt(grantText, clientProfile, conversation);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          system,
          messages: [
            { role: 'user', content: 'Generate the complete grant application now.' },
          ],
        });

        for await (const chunk of apiStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Anthropic API error';
        controller.enqueue(encoder.encode(`\n__ERROR__${msg}`));
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
