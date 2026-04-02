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
  const [activeId, setActiveId] = useState(draft.sections[0]?.id ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeSection = draft.sections.find((s) => s.id === activeId);

  function handleSave(updated: ApplicationSection) {
    onDraftChange({
      ...draft,
      sections: draft.sections.map((s) => (s.id === updated.id ? updated : s)),
    });
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Application header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{grantName}</h2>
          <p className="text-sm text-neutral-400">{clientName}</p>
        </div>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-black hover:bg-[#b8963f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? 'Exporting…' : 'Export .docx'}
        </button>
      </div>

      {/* Section tabs — horizontally scrollable */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-neutral-700 bg-neutral-900 p-1">
        {draft.sections.map((s) => (
          <button
            key={s.id}
            onClick={() => { setActiveId(s.id); setEditingId(null); }}
            className={[
              'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              activeId === s.id
                ? 'bg-[#C9A84C] text-black'
                : 'text-neutral-400 hover:text-white',
            ].join(' ')}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Active section */}
      {activeSection && (
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">{activeSection.title}</h3>
            {editingId !== activeSection.id && (
              <button
                onClick={() => setEditingId(activeSection.id)}
                className="text-xs text-neutral-500 hover:text-[#C9A84C] transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingId === activeSection.id ? (
            <SectionEditor
              section={activeSection}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="space-y-3">
              {activeSection.content.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-neutral-200">
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* Word count */}
          {editingId !== activeSection.id && (
            <p className="mt-4 text-right text-xs text-neutral-600">
              {activeSection.content.split(/\s+/).filter(Boolean).length} words
            </p>
          )}
        </div>
      )}
    </div>
  );
}
