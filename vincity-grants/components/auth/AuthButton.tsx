'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-neutral-500 sm:block truncate max-w-[140px]">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push('/auth')}
      className="rounded-md border border-[#C9A84C]/40 px-3 py-1.5 text-xs font-medium text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10"
    >
      Sign in
    </button>
  );
}
