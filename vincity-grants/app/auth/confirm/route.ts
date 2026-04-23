import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function sanitizeNextPath(next: string | null, origin: string): string {
  const fallback = '/dashboard';
  if (!next) return fallback;
  if (next.startsWith('/')) return next;
  try {
    const u = new URL(next, origin);
    if (u.origin !== new URL(origin).origin) return fallback;
    return `${u.pathname}${u.search}` || fallback;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextPath = sanitizeNextPath(searchParams.get('next'), request.nextUrl.origin);

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = nextPath;
  redirectTo.search = '';
  redirectTo.hash = '';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  const fail = request.nextUrl.clone();
  fail.pathname = '/auth';
  fail.searchParams.set('error', 'email_confirm_failed');
  return NextResponse.redirect(fail);
}
