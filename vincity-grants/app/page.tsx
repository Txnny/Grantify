'use client';

import { useEffect, useState } from 'react';
import IngestPanel from '@/components/ingest/IngestPanel';
import ClientForm from '@/components/intake/ClientForm';
import { ClientProfile, GrantSession, IngestedSource } from '@/lib/types';

type Stage = 'ingest' | 'intake' | 'interview' | 'draft';

const STAGE_LABELS: Record<Stage, string> = {
  ingest: 'Load Grant',
  intake: 'Client Intake',
  interview: 'Interview',
  draft: 'Application Draft',
};

const STAGE_ORDER: Stage[] = ['ingest', 'intake', 'interview', 'draft'];

const EMPTY_SESSION: GrantSession = {
  sources: [],
  grantText: '',
  client: null,
  conversation: [],
  draft: null,
};

function buildGrantText(sources: IngestedSource[]): string {
  return sources.map((s) => `--- ${s.label} ---\n${s.text}`).join('\n\n');
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('ingest');
  const [session, setSession] = useState<GrantSession>(EMPTY_SESSION);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('vincity-session');
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        // ignore corrupt storage
      }
    }
  }, []);

  function saveSession(next: GrantSession) {
    setSession(next);
    sessionStorage.setItem('vincity-session', JSON.stringify(next));
  }

  // ── Ingest handlers ──────────────────────────────────────────────────────

  function handleAddSource(source: IngestedSource) {
    const sources = [...session.sources, source];
    saveSession({ ...session, sources, grantText: buildGrantText(sources) });
  }

  function handleRemoveSource(id: string) {
    const sources = session.sources.filter((s) => s.id !== id);
    saveSession({ ...session, sources, grantText: buildGrantText(sources) });
  }

  // ── Intake handler ───────────────────────────────────────────────────────

  function handleClientSubmit(profile: ClientProfile) {
    saveSession({ ...session, client: profile });
    setStage('interview');
  }

  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Top bar */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-[#C9A84C] uppercase">
              VinCity
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-400">Grant Intelligence</span>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('vincity-session');
              setSession(EMPTY_SESSION);
              setStage('ingest');
            }}
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            New session
          </button>
        </div>
      </header>

      {/* Stage progress tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex">
            {STAGE_ORDER.map((s, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;
              return (
                <div
                  key={s}
                  className={[
                    'flex-1 py-3 text-center text-xs font-medium transition-colors',
                    isActive
                      ? 'text-[#C9A84C]'
                      : isDone
                        ? 'text-neutral-400'
                        : 'text-neutral-600',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block border-b-2 pb-0.5',
                      isActive ? 'border-[#C9A84C]' : 'border-transparent',
                    ].join(' ')}
                  >
                    {STAGE_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage content */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {stage === 'ingest' && (
          <IngestPanel
            sources={session.sources}
            onAdd={handleAddSource}
            onRemove={handleRemoveSource}
            onContinue={() => setStage('intake')}
          />
        )}

        {stage === 'intake' && (
          <ClientForm
            initial={session.client ?? undefined}
            onSubmit={handleClientSubmit}
            onBack={() => setStage('ingest')}
          />
        )}

        {stage === 'interview' && (
          <div className="text-center text-neutral-500">
            <p className="text-lg">Interview — coming in Step 4</p>
            <button
              onClick={() => setStage('intake')}
              className="mt-4 text-sm text-[#C9A84C] hover:underline"
            >
              ← Back to Intake
            </button>
          </div>
        )}

        {stage === 'draft' && (
          <div className="text-center text-neutral-500">
            <p className="text-lg">Draft — coming in Step 5</p>
          </div>
        )}
      </main>
    </div>
  );
}
