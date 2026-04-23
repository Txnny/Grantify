'use client';

import { useEffect, useRef, useState } from 'react';
import { ApplicationDraft, ClientProfile, ConversationMessage } from '@/lib/types';
import { parseDraftJson } from '@/lib/parseDraftResponse';
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
      let bodyStr: string;
      try {
        bodyStr = JSON.stringify({ grantText, clientProfile, conversation });
      } catch (e) {
        setError(`Serialization error: ${e instanceof Error ? e.message : String(e)}`);
        setIsGenerating(false);
        return;
      }

      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        setError(errText || `HTTP ${res.status} — draft generation failed. Please retry.`);
        return;
      }

      if (!res.body) {
        setError('No response body — draft generation failed. Please retry.');
        return;
      }

      // Consume the streaming plain-text response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        // Check for server-side error signal
        const errIdx = accumulated.indexOf('__ERROR__');
        if (errIdx !== -1) {
          setError(accumulated.slice(errIdx + 9) || 'Draft generation failed. Please retry.');
          return;
        }
      }

      // Final flush
      accumulated += decoder.decode();

      const errIdx = accumulated.indexOf('__ERROR__');
      if (errIdx !== -1) {
        setError(accumulated.slice(errIdx + 9) || 'Draft generation failed. Please retry.');
        return;
      }

      let data: ApplicationDraft;
      try {
        data = parseDraftJson<ApplicationDraft>(accumulated);
      } catch (parseErr) {
        console.error('[DraftView] JSON parse failed:', parseErr);
        const preview = accumulated.slice(0, 300).trim() || '(empty response)';
        const hint =
          parseErr instanceof Error &&
          (parseErr.message.includes('truncated') || parseErr.message.includes('likely truncated'))
            ? ' The stream may have hit the token limit — try again or increase max_tokens on /api/draft.'
            : '';
        setError(
          `Failed to parse draft response.${hint} Start of response: "${preview}"`
        );
        return;
      }

      setDraft(data);
      onDraftReady(data);
    } catch (err) {
      console.error('[DraftView] generateDraft error:', err);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      setError(msg);
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
