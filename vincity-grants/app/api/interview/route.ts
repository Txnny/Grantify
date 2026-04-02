import { NextRequest } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';
import { interviewSystemPrompt } from '@/lib/prompts';
import { ClientProfile, ConversationMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const grantText: string = body?.grantText ?? '';
  const clientProfile: ClientProfile | null = body?.clientProfile ?? null;
  const conversationHistory: ConversationMessage[] = body?.conversationHistory ?? [];

  if (!grantText || !clientProfile) {
    return new Response('grantText and clientProfile are required', { status: 400 });
  }

  const system = interviewSystemPrompt(grantText, clientProfile);

  const messages: { role: 'user' | 'assistant'; content: string }[] =
    conversationHistory.length === 0
      ? [{ role: 'user', content: 'Please begin the interview with your first question.' }]
      : conversationHistory.map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system,
          messages,
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
        // Encode the actual error so the client can display it
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
