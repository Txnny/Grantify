'use client';

import { useState } from 'react';
import { IngestedSource } from '@/lib/types';

interface Props {
  onAdd: (source: IngestedSource) => void;
}

export default function UrlFetcher({ onAdd }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to fetch page');
        return;
      }

      onAdd({
        id: crypto.randomUUID(),
        type: 'url',
        label: data.title || trimmed,
        text: data.text,
        url: data.url,
      });

      setUrl('');
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-300">
        Grant page URL
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          placeholder="https://torontoartscouncil.org/grants/…"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition-colors"
          disabled={loading}
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          className="rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#b8963f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Fetching…' : 'Fetch'}
        </button>
      </div>
      {error && (
        <p className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
