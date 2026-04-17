'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import IngestPanel from '@/components/ingest/IngestPanel';
import ClientForm from '@/components/intake/ClientForm';
import InterviewChat from '@/components/interview/InterviewChat';
import DraftView from '@/components/draft/DraftView';
import {
  ApplicationDraft,
  BusinessProfile,
  ConversationMessage,
  GrantSession,
  IngestedSource,
} from '@/lib/types';
import { saveApplication } from '@/lib/storage';

type Stage = 'ingest' | 'intake' | 'interview' | 'draft';

const STAGE_LABELS: Record<Stage, string> = {
  ingest: 'Load Grant',
  intake: 'Business Intake',
  interview: 'Interview',
  draft: 'Application Draft',
};

const STAGE_ORDER: Stage[] = ['ingest', 'intake', 'interview', 'draft'];

const EMPTY_SESSION: GrantSession = {
  sources: [],
  grantText: '',
  business: null,
  conversation: [],
  draft: null,
};

function buildGrantText(sources: IngestedSource[]): string {
  return sources.map((s) => `--- ${s.label} ---\n${s.text}`).join('\n\n');
}

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('ingest');
  const [session, setSession] = useState<GrantSession>(EMPTY_SESSION);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('gb-session');
    const storedStage = localStorage.getItem('gb-stage') as Stage | null;
    const storedId = localStorage.getItem('gb-session-id');
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch { /* ignore corrupt storage */ }
    }
    if (storedStage && STAGE_ORDER.includes(storedStage)) {
      setStage(storedStage);
    }
    if (storedId) {
      setSessionId(storedId);
    } else {
      const id = crypto.randomUUID();
      setSessionId(id);
      localStorage.setItem('gb-session-id', id);
    }
  }, []);

  function saveSession(next: GrantSession, nextStage?: Stage) {
    setSession(next);
    localStorage.setItem('gb-session', JSON.stringify(next));
    const status = next.draft ? 'draft-ready' : 'in-progress';
    saveApplication({
      id: sessionId || 'default',
      grantName: next.business?.grantName ?? 'Untitled Grant',
      companyName: next.business?.companyName ?? 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status,
      session: next,
    });
    if (nextStage) {
      setStage(nextStage);
      localStorage.setItem('gb-stage', nextStage);
    }
  }

  function goToStage(s: Stage) {
    setStage(s);
    localStorage.setItem('gb-stage', s);
  }

  function handleAddSource(source: IngestedSource) {
    const sources = [...session.sources, source];
    saveSession({ ...session, sources, grantText: buildGrantText(sources) });
  }

  function handleRemoveSource(id: string) {
    const sources = session.sources.filter((s) => s.id !== id);
    saveSession({ ...session, sources, grantText: buildGrantText(sources) });
  }

  function handleBusinessSubmit(profile: BusinessProfile) {
    saveSession({ ...session, business: profile, conversation: [], draft: null }, 'interview');
  }

  function handleInterviewComplete(history: ConversationMessage[]) {
    saveSession({ ...session, conversation: history }, 'draft');
  }

  function handleDraftReady(draft: ApplicationDraft) {
    saveSession({ ...session, draft });
  }

  const currentIndex = STAGE_ORDER.indexOf(stage);

  function canNavigateTo(s: Stage) {
    const idx = STAGE_ORDER.indexOf(s);
    if (idx <= currentIndex) return true;
    if (s === 'intake') return session.sources.length > 0;
    if (s === 'interview') return !!session.business;
    if (s === 'draft') return session.conversation.length > 0;
    return false;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Top bar */}
      <header className="border-b border-blue-900/40 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-blue-400 uppercase">
              Grantify
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-400">Business</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-neutral-400 hover:text-blue-400 transition-colors"
            >
              My Applications
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('gb-session');
                localStorage.removeItem('gb-stage');
                localStorage.removeItem('gb-session-id');
                const id = crypto.randomUUID();
                setSessionId(id);
                localStorage.setItem('gb-session-id', id);
                setSession(EMPTY_SESSION);
                setStage('ingest');
              }}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              New session
            </button>
          </div>
        </div>
      </header>

      {/* Stage progress tabs */}
      <div className="border-b border-blue-900/30 bg-[#060c1a]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex">
            {STAGE_ORDER.map((s, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;
              const isClickable = canNavigateTo(s);
              return (
                <button
                  key={s}
                  disabled={!isClickable}
                  onClick={() => isClickable && goToStage(s)}
                  className={[
                    'flex-1 py-3 text-center text-xs font-medium transition-colors',
                    isActive
                      ? 'text-blue-400'
                      : isDone
                        ? 'text-neutral-400 hover:text-neutral-200'
                        : isClickable
                          ? 'text-neutral-500 hover:text-neutral-300'
                          : 'text-neutral-700 cursor-not-allowed',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block border-b-2 pb-0.5',
                      isActive ? 'border-blue-400' : 'border-transparent',
                    ].join(' ')}
                  >
                    {isDone && <span className="mr-1 text-blue-400">✓</span>}
                    {STAGE_LABELS[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Back / Forward nav bar */}
      {(currentIndex > 0 || currentIndex < STAGE_ORDER.length - 1) && (
        <div className="border-b border-blue-900/20 bg-[#0a0f1e]">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2">
            <button
              onClick={() => currentIndex > 0 && goToStage(STAGE_ORDER[currentIndex - 1])}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 disabled:opacity-0 transition-colors"
            >
              ← {currentIndex > 0 ? STAGE_LABELS[STAGE_ORDER[currentIndex - 1]] : ''}
            </button>
            <span className="text-xs text-neutral-700">
              {currentIndex + 1} / {STAGE_ORDER.length}
            </span>
            <button
              onClick={() => {
                const next = STAGE_ORDER[currentIndex + 1];
                if (next && canNavigateTo(next)) goToStage(next);
              }}
              disabled={
                currentIndex >= STAGE_ORDER.length - 1 ||
                !canNavigateTo(STAGE_ORDER[currentIndex + 1])
              }
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 disabled:opacity-0 transition-colors"
            >
              {currentIndex < STAGE_ORDER.length - 1 ? STAGE_LABELS[STAGE_ORDER[currentIndex + 1]] : ''} →
            </button>
          </div>
        </div>
      )}

      {/* Stage content */}
      <main
        className={[
          'mx-auto max-w-4xl px-6',
          stage === 'interview' ? 'py-4' : 'py-10',
        ].join(' ')}
      >
        {stage === 'ingest' && (
          <IngestPanel
            sources={session.sources}
            onAdd={handleAddSource}
            onRemove={handleRemoveSource}
            onContinue={() => goToStage('intake')}
          />
        )}

        {stage === 'intake' && (
          <ClientForm
            initial={session.business ?? undefined}
            onSubmit={handleBusinessSubmit}
            onBack={() => goToStage('ingest')}
          />
        )}

        {stage === 'interview' && session.business && (
          <InterviewChat
            grantText={session.grantText}
            clientProfile={session.business}
            initialHistory={session.conversation}
            onComplete={handleInterviewComplete}
            onBack={() => goToStage('intake')}
          />
        )}

        {stage === 'interview' && !session.business && (
          <div className="text-center text-neutral-500">
            <p>Missing business profile.</p>
            <button onClick={() => goToStage('intake')} className="mt-3 text-sm text-blue-400">
              ← Go to Intake
            </button>
          </div>
        )}

        {stage === 'draft' && session.business && (
          <DraftView
            grantText={session.grantText}
            clientProfile={session.business}
            conversation={session.conversation}
            initialDraft={session.draft}
            onDraftReady={handleDraftReady}
            onBack={() => goToStage('interview')}
          />
        )}

        {stage === 'draft' && !session.business && (
          <div className="text-center text-neutral-500">
            <p>Missing session data.</p>
            <button onClick={() => goToStage('ingest')} className="mt-3 text-sm text-blue-400">
              ← Start over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
