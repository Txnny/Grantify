'use client';

import { useState } from 'react';
import { IngestedSource } from '@/lib/types';
import UrlFetcher from './UrlFetcher';
import FileUpload from './FileUpload';
import SourceList from './SourceList';

type Mode = 'paste' | 'url' | 'file';

interface Props {
  sources: IngestedSource[];
  onAdd: (source: IngestedSource) => void;
  onRemove: (id: string) => void;
  onContinue: () => void;
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'paste', label: 'Paste Text' },
  { id: 'url', label: 'Fetch URL' },
  { id: 'file', label: 'Upload File' },
];

export default function IngestPanel({ sources, onAdd, onRemove, onContinue }: Props) {
  const [mode, setMode] = useState<Mode>('paste');
  const [pasteText, setPasteText] = useState('');
  const [pasteLabel, setPasteLabel] = useState('');

  function handleAddPaste() {
    const text = pasteText.trim();
    if (!text) return;
    onAdd({
      id: crypto.randomUUID(),
      type: 'paste',
      label: pasteLabel.trim() || 'Pasted grant text',
      text,
    });
    setPasteText('');
    setPasteLabel('');
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Load the Grant</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Add the grant requirements. Mix sources — paste guidelines, fetch the
          grant page, or upload a PDF / DOCX.
        </p>
      </div>

      {/* Mode switcher */}
      <div className="mb-6 flex gap-1 rounded-lg border border-neutral-700 bg-neutral-800 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={[
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              mode === m.id
                ? 'bg-[#C9A84C] text-black'
                : 'text-neutral-400 hover:text-white',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode panels */}
      {mode === 'paste' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Label <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              type="text"
              value={pasteLabel}
              onChange={(e) => setPasteLabel(e.target.value)}
              placeholder="e.g. TAC Black Arts Projects Guidelines"
              className="mt-1.5 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Grant text
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the full grant guidelines, eligibility criteria, and evaluation rubric here…"
              rows={10}
              className="mt-1.5 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition-colors resize-y"
            />
          </div>
          <button
            onClick={handleAddPaste}
            disabled={!pasteText.trim()}
            className="rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#b8963f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Source
          </button>
        </div>
      )}

      {mode === 'url' && <UrlFetcher onAdd={onAdd} />}

      {mode === 'file' && <FileUpload onAdd={onAdd} />}

      {/* Source list */}
      <SourceList sources={sources} onRemove={onRemove} />

      {/* Continue */}
      {sources.length > 0 && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onContinue}
            className="rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#b8963f] transition-colors"
          >
            Continue to Client Intake →
          </button>
        </div>
      )}
    </div>
  );
}
