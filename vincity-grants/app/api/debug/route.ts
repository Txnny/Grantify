import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? '';
  return NextResponse.json({
    set: !!key,
    prefix: key.slice(0, 20),
    suffix: key.slice(-6),
    length: key.length,
  });
}
