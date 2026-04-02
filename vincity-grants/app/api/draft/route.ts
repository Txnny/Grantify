import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/anthropic';
import { draftSystemPrompt } from '@/lib/prompts';
import { ApplicationDraft, ClientProfile, ConversationMessage } from '@/lib/types';

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
      max_tokens: 4096,
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

  // Parse JSON — handle both raw and fenced variants
  let draft: ApplicationDraft;
  try {
    draft = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try {
        draft = JSON.parse(fenced[1].trim());
      } catch {
        return NextResponse.json(
          { error: 'Could not parse Claude response as JSON', raw },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Could not parse Claude response as JSON', raw },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(draft);
}
