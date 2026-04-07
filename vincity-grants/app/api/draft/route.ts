import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';
import { draftSystemPrompt } from '@/lib/prompts';
import { ApplicationDraft, ClientProfile, ConversationMessage } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const grantText: string = body?.grantText ?? '';
  const clientProfile: ClientProfile | null = body?.clientProfile ?? null;
  const conversation: ConversationMessage[] = body?.conversation ?? [];

  if (!grantText || !clientProfile) {
    return NextResponse.json(
      { error: 'grantText and clientProfile are required' },
      { status: 400 }
    );
  }

  const system = draftSystemPrompt(grantText, clientProfile, conversation);

  let raw: string;
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system,
      messages: [
        { role: 'user', content: 'Generate the complete grant application now.' },
      ],
    });
    raw = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Anthropic API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Parse JSON — try raw, fenced, then first {...} block
  let draft: ApplicationDraft;
  try {
    draft = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try {
        draft = JSON.parse(fenced[1].trim());
      } catch { /* fall through */ }
    }
    if (!draft!) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          draft = JSON.parse(raw.slice(start, end + 1));
        } catch { /* fall through */ }
      }
    }
    if (!draft!) {
      return NextResponse.json({ error: 'Could not parse draft response', raw }, { status: 500 });
    }
  }

  return NextResponse.json(draft);
}
