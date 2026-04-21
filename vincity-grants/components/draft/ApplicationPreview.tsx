'use client';

import { useState } from 'react';
import { ApplicationDraft, ApplicationSection } from '@/lib/types';
import SectionEditor from './SectionEditor';

interface Props {
  draft: ApplicationDraft;
  clientName: string;
  grantName: string;
  onDraftChange: (next: ApplicationDraft) => void;
  onExport: () => void;
  isExporting: boolean;
}

export default function ApplicationPreview({
  draft,
  clientName,
  grantName,
  onDraftChange,
  onExport,
  isExporting,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSave(updated: ApplicationSection) {
    onDraftChange({
      ...draft,
      sections: draft.sections.map((s) => (s.id === updated.id ? updated : s)),
    });
    setEditingId(null);
  }

  function handleCopyAll() {
    const text = draft.sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      {/* Document header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{grantName}</h2>
          <p className="text-sm text-neutral-400">{clientName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="rounded-md border border-neutral-700 px-4 py-2 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy all'}
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-black hover:bg-[#b8963f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? 'Exporting…' : 'Export .docx'}
          </button>
        </div>
      </div>

      {/* All sections stacked */}
      <div className="space-y-4">
        {draft.sections.map((section, idx) => (
          <div
            key={section.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
          >
            {/* Section header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-500">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-semibold text-white">{section.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-600">
                  {section.content.split(/\s+/).filter(Boolean).length} words
                </span>
                {editingId !== section.id && (
                  <button
                    onClick={() => setEditingId(section.id)}
                    className="rounded border border-neutral-700 px-2.5 py-1 text-[11px] text-neutral-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Section body */}
            <div className="px-5 py-4">
              {editingId === section.id ? (
                <SectionEditor
                  section={section}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="space-y-3">
                  {section.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-neutral-200">
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom export bar */}
      <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/90 px-5 py-3 backdrop-blur">
        <p className="text-xs text-neutral-500">
          {draft.sections.reduce(
            (sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length,
            0
          )}{' '}
          total words · {draft.sections.length} sections
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopyAll}
            className="rounded-md border border-neutral-700 px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy all'}
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="rounded-md bg-[#C9A84C] px-5 py-2 text-xs font-semibold text-black hover:bg-[#b8963f] disabled:opacity-50 transition-colors"
          >
            {isExporting ? 'Exporting…' : 'Export .docx'}
          </button>
        </div>
      </div>
    </div>
  );
}
