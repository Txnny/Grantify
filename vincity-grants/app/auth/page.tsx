'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('error') === 'email_confirm_failed') {
      setError(
        'That confirmation link is invalid or expired. Sign in if you already confirmed, or use “Resend confirmation” after signing up again with the same email.'
      );
      const u = new URL(window.location.href);
      u.searchParams.delete('error');
      window.history.replaceState({}, '', u.pathname + u.search);
    }
  }, []);

  function emailRedirectTo() {
    return `${window.location.origin}/auth/confirm?next=/dashboard`;
  }

  async function handleResend() {
    setError('');
    setResendLoading(true);
    const supabase = createClient();
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: emailRedirectTo() },
      });
      if (resendErr) throw resendErr;
      setSuccess(
        'Another confirmation email is on its way. Check spam and Promotions, and wait a few minutes before trying again.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email.');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAwaitingEmailConfirm(false);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'signup') {
        const { data, error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: emailRedirectTo(),
          },
        });
        if (signErr) throw signErr;

        if (data.session) {
          router.push('/dashboard');
          router.refresh();
          return;
        }

        const identities = data.user?.identities ?? [];
        if (data.user && identities.length === 0) {
          setAwaitingEmailConfirm(true);
          setError(
            'Supabase treats this email as already registered (often an unconfirmed duplicate signup). Try Sign in, or use “Resend confirmation” with the email above.'
          );
          return;
        }

        setAwaitingEmailConfirm(true);
        setSuccess(
          'If this address is new, Supabase will send a confirmation link. Check spam and Promotions. No email after several minutes usually means SMTP is not configured in the Supabase dashboard, or the address is already confirmed — try Sign in.'
        );
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center">
          <button type="button" onClick={() => router.push('/')} className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-[#C9A84C] uppercase">VinCity</span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-400">Grant Intelligence</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-semibold text-white">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mb-8 text-sm text-neutral-500">
            {mode === 'login'
              ? 'Access your saved grant applications.'
              : 'Save and resume your grant applications from any device.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-900 bg-red-900/20 px-4 py-2.5 text-xs text-red-400">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-green-900 bg-green-900/20 px-4 py-2.5 text-xs text-green-400">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#C9A84C] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#b8963f] disabled:opacity-60"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>

            {awaitingEmailConfirm && mode === 'signup' && (
              <button
                type="button"
                disabled={resendLoading || !email}
                onClick={handleResend}
                className="w-full rounded-lg border border-neutral-600 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
              >
                {resendLoading ? 'Sending…' : 'Resend confirmation email'}
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setSuccess('');
                setAwaitingEmailConfirm(false);
              }}
              className="text-[#C9A84C] hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
