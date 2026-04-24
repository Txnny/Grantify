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
      setError('That confirmation link is invalid or expired. Try signing in directly.');
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
      setSuccess('Confirmation email sent — check spam and Promotions.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email.');
    } finally {
      setResendLoading(false);
    }
  }

  async function trySignIn(emailVal: string, passwordVal: string): Promise<boolean> {
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password: passwordVal,
    });
    if (!signInErr) {
      router.push('/dashboard');
      router.refresh();
      return true;
    }
    return false;
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

        // Email confirmation disabled — session returned immediately
        if (data.session) {
          router.push('/dashboard');
          router.refresh();
          return;
        }

        // Email already registered (confirmed or unconfirmed) — try signing in directly
        const identities = data.user?.identities ?? [];
        if (data.user && identities.length === 0) {
          const ok = await trySignIn(email, password);
          if (ok) return;
          // Wrong password for existing account
          setError('This email is already registered. Check your password and use Sign in.');
          setMode('login');
          return;
        }

        // New signup, email confirmation required
        setAwaitingEmailConfirm(true);
        setSuccess('Check your inbox for a confirmation link. If nothing arrives, your Supabase project needs SMTP configured — or ask the admin to disable email confirmation.');
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
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button type="button" onClick={() => router.push('/')} className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-[#C9A84C] uppercase">VinCity</span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-400">Grant Intelligence</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Continue without account →
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-semibold text-white">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mb-8 text-sm text-neutral-500">
            {mode === 'login'
              ? 'Access your saved applications from any device.'
              : 'Save and resume applications from any device. Or '}
            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-[#C9A84C] hover:underline"
              >
                continue without an account.
              </button>
            )}
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
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            {awaitingEmailConfirm && mode === 'signup' && (
              <button
                type="button"
                disabled={resendLoading || !email}
                onClick={handleResend}
                className="w-full rounded-lg border border-neutral-700 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {resendLoading ? 'Sending…' : 'Resend confirmation email'}
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-neutral-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); setAwaitingEmailConfirm(false); }}
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
