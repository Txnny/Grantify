import { NextRequest } from 'next/server';
import { anthropic, MODEL, streamToResponse } from '@/lib/anthropic';
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

  // Build messages array. API requires messages starting with 'user'.
  // If history is empty, seed with a silent kick-off message.
  const messages: { role: 'user' | 'assistant'; content: string }[] =
    conversationHistory.length === 0
      ? [{ role: 'user', content: 'Please begin the interview with your first question.' }]
      : conversationHistory.map((m) => ({ role: m.role, content: m.content }));

  const stream = streamToResponse({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages,
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
