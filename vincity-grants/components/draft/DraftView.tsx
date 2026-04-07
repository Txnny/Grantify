'use client';

import { useEffect, useRef, useState } from 'react';
import { ApplicationDraft, ClientProfile, ConversationMessage } from '@/lib/types';
import ApplicationPreview from './ApplicationPreview';
import StrengthScore from './StrengthScore';

interface Props {
  grantText: string;
  clientProfile: ClientProfile;
  conversation: ConversationMessage[];
  initialDraft: ApplicationDraft | null;
  onDraftReady: (draft: ApplicationDraft) => void;
  onBack: () => void;
}

export default function DraftView({
  grantText,
  clientProfile,
  conversation,
  initialDraft,
  onDraftReady,
  onBack,
}: Props) {
  const [draft, setDraft] = useState<ApplicationDraft | null>(initialDraft);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generated = useRef(false);

  useEffect(() => {
    if (draft || generated.current) return;
    generated.current = true;
    generateDraft();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateDraft() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantText, clientProfile, conversation }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        setError(text || 'Draft generation failed');
        return;
      }

      // Stream the response and accumulate
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      if (accumulated.startsWith('__ERROR__')) {
        setError(accumulated.slice(9) || 'Draft generation failed');
        return;
      }

      // Parse JSON — try raw, fenced, then first {...} block
      let data;
      try {
        data = JSON.parse(accumulated);
      } catch {
        const fenced = accumulated.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenced) {
          try { data = JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
        }
        if (!data) {
          // Extract outermost {...} JSON object
          const start = accumulated.indexOf('{');
          const end = accumulated.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            try { data = JSON.parse(accumulated.slice(start, end + 1)); } catch { /* fall through */ }
          }
        }
        if (!data) {
          setError('Could not parse draft response. Please retry.');
          return;
        }
      }

      setDraft(data);
      onDraftReady(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExport() {
    if (!draft) return;
    setIsExporting(true);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: draft.sections,
          clientName: clientProfile.artistName,
          grantName: clientProfile.grantName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Export failed');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clientProfile.artistName} - ${clientProfile.grantName}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export error');
    } finally {
      setIsExporting(false);
    }
  }

  function handleDraftChange(next: ApplicationDraft) {
    setDraft(next);
    onDraftReady(next);
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#C9A84C]" />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#C9A84C]">
              VC
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Generating application…</p>
            <p className="mt-1 text-sm text-neutral-400">
              Claude is writing your 7-section draft. This takes 20–40 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm font-semibold text-red-400">Generation failed</p>
        <p className="mt-1 text-xs text-neutral-500">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Back to Interview
          </button>
          <button
            onClick={() => { setError(null); generated.current = false; generateDraft(); }}
            className="rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-black hover:bg-[#b8963f] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Draft ready ───────────────────────────────────────────────────────────

  if (!draft) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Application Draft</h1>
        <button
          onClick={onBack}
          className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          ← Back to Interview
        </button>
      </div>

      <StrengthScore scores={draft.scores} flags={draft.flags} />

      <ApplicationPreview
        draft={draft}
        clientName={clientProfile.artistName}
        grantName={clientProfile.grantName}
        onDraftChange={handleDraftChange}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}
