'use client';

import { useRef, useState } from 'react';
import { ApplicationDraft, ClientProfile } from '@/lib/types';
import { parseDraftJson } from '@/lib/parseDraftResponse';
import ApplicationPreview from './ApplicationPreview';
import StrengthScore from './StrengthScore';

interface Props {
  existingDraft: ApplicationDraft;
  clientProfile: ClientProfile;
  onClose: () => void;
}

type PanelState = 'setup' | 'generating' | 'done' | 'error';

export default function TranslatePanel({ existingDraft, clientProfile, onClose }: Props) {
  const [panelState, setPanelState] = useState<PanelState>('setup');
  const [newGrantText, setNewGrantText] = useState('');
  const [newGrantName, setNewGrantName] = useState('');
  const [translatedDraft, setTranslatedDraft] = useState<ApplicationDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const generated = useRef(false);

  async function handleTranslate() {
    if (!newGrantText.trim() || !newGrantName.trim()) return;
    generated.current = true;
    setPanelState('generating');
    setError(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingDraft, newGrantText, clientProfile }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        setError(errText || `HTTP ${res.status} — translation failed. Please retry.`);
        setPanelState('error');
        return;
      }

      if (!res.body) {
        setError('No response body — translation failed. Please retry.');
        setPanelState('error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });

        const errIdx = accumulated.indexOf('__ERROR__');
        if (errIdx !== -1) {
          setError(accumulated.slice(errIdx + 9) || 'Translation failed. Please retry.');
          setPanelState('error');
          return;
        }
      }

      accumulated += decoder.decode();

      const errIdx = accumulated.indexOf('__ERROR__');
      if (errIdx !== -1) {
        setError(accumulated.slice(errIdx + 9) || 'Translation failed. Please retry.');
        setPanelState('error');
        return;
      }

      let data: ApplicationDraft;
      try {
        data = parseDraftJson<ApplicationDraft>(accumulated);
      } catch (parseErr) {
        const preview = accumulated.slice(0, 300).trim() || '(empty response)';
        setError(`Failed to parse translated draft. Start of response: "${preview}"`);
        setPanelState('error');
        return;
      }

      setTranslatedDraft(data);
      setPanelState('done');
    } catch (err) {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      setPanelState('error');
    }
  }

  async function handleExport() {
    if (!translatedDraft) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: translatedDraft.sections,
          clientName: clientProfile.artistName,
          grantName: newGrantName,
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
      a.download = `${clientProfile.artistName} - ${newGrantName}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export error');
    } finally {
      setIsExporting(false);
    }
  }

  function handleDraftChange(next: ApplicationDraft) {
    setTranslatedDraft(next);
  }

  // ── Overlay backdrop ──────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-700 bg-[#0f0f0f] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">Grant Translation Layer</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Remap your existing application to a new funder's criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        {/* Setup state */}
        {panelState === 'setup' && (
          <div className="space-y-5 px-6 py-6">
            {/* Source summary */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                Source application
              </p>
              <p className="text-sm font-medium text-white">{clientProfile.grantName}</p>
              <p className="text-xs text-neutral-400">{clientProfile.artistName} · {existingDraft.sections.length} sections · {existingDraft.scores.overall}/100</p>
            </div>

            {/* New grant name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                New grant name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newGrantName}
                onChange={(e) => setNewGrantName(e.target.value)}
                placeholder="e.g. OAC Recommender Grants for Artists"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            {/* New grant text */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                New grant guidelines / criteria <span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs text-neutral-600">
                Paste the full guidelines, evaluation criteria, and eligibility requirements for the target grant.
              </p>
              <textarea
                value={newGrantText}
                onChange={(e) => setNewGrantText(e.target.value)}
                placeholder="Paste the new grant's guidelines, eligibility criteria, and evaluation rubric here…"
                rows={10}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[#C9A84C] focus:outline-none resize-y"
              />
              <p className="mt-1 text-right text-xs text-neutral-700">
                {newGrantText.length.toLocaleString()} chars
                {newGrantText.length > 12000 && (
                  <span className="ml-1 text-yellow-500">(will be trimmed to 12,000)</span>
                )}
              </p>
            </div>

            <button
              onClick={handleTranslate}
              disabled={!newGrantText.trim() || !newGrantName.trim()}
              className="w-full rounded-lg bg-[#C9A84C] py-3 text-sm font-semibold text-black hover:bg-[#b8963f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Translate Application →
            </button>
          </div>
        )}

        {/* Generating state */}
        {panelState === 'generating' && (
          <div className="flex flex-col items-center gap-6 px-6 py-20 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#C9A84C]" />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#C9A84C]">
                VC
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Translating application…</p>
              <p className="mt-1 text-sm text-neutral-400">
                Remapping your story to <span className="text-[#C9A84C]">{newGrantName}</span>. Takes 20–40 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {panelState === 'error' && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-red-400">Translation failed</p>
            <p className="mt-1 text-xs text-neutral-500">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => { setPanelState('setup'); generated.current = false; }}
                className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                ← Edit inputs
              </button>
              <button
                onClick={() => { generated.current = false; handleTranslate(); }}
                className="rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-black hover:bg-[#b8963f] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Done state */}
        {panelState === 'done' && translatedDraft && (
          <div className="space-y-6 px-6 py-6">
            {/* Comparison banner */}
            <div className="flex items-center gap-3 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-neutral-500">Source</p>
                <p className="truncate text-sm font-medium text-white">{clientProfile.grantName}</p>
              </div>
              <span className="shrink-0 text-lg text-[#C9A84C]">→</span>
              <div className="min-w-0 flex-1 text-right">
                <p className="truncate text-xs text-neutral-500">Translated</p>
                <p className="truncate text-sm font-medium text-[#C9A84C]">{newGrantName}</p>
              </div>
            </div>

            <StrengthScore scores={translatedDraft.scores} flags={translatedDraft.flags} />

            <ApplicationPreview
              draft={translatedDraft}
              clientName={clientProfile.artistName}
              grantName={newGrantName}
              onDraftChange={handleDraftChange}
              onExport={handleExport}
              isExporting={isExporting}
            />

            {/* Translate another */}
            <div className="pt-2 text-center">
              <button
                onClick={() => { setPanelState('setup'); setNewGrantText(''); setNewGrantName(''); generated.current = false; }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                ← Translate to another grant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
