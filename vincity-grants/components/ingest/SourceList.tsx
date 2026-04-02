'use client';

import { IngestedSource } from '@/lib/types';

interface Props {
  sources: IngestedSource[];
  onRemove: (id: string) => void;
}

const MODE_LABEL: Record<IngestedSource['type'], string> = {
  paste: 'Pasted',
  url: 'URL',
  file: 'File',
};

export default function SourceList({ sources, onRemove }: Props) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-6 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Loaded Sources
      </p>
      {sources.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{s.label}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {MODE_LABEL[s.type]} &middot; {s.text.length.toLocaleString()} chars
            </p>
          </div>
          <button
            onClick={() => onRemove(s.id)}
            className="ml-4 shrink-0 text-xs text-neutral-500 hover:text-red-400 transition-colors"
            aria-label={`Remove ${s.label}`}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
