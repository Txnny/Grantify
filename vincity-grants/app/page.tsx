'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import IngestPanel from '@/components/ingest/IngestPanel';
import ClientForm from '@/components/intake/ClientForm';
import InterviewChat from '@/components/interview/InterviewChat';
import DraftView from '@/components/draft/DraftView';
import AuthButton from '@/components/auth/AuthButton';
import {
  ApplicationDraft,
  ClientProfile,
  ConversationMessage,
  GrantSession,
  IngestedSource,
} from '@/lib/types';
import { saveApplication } from '@/lib/storage';

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
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('ingest');
  const [session, setSession] = useState<GrantSession>(EMPTY_SESSION);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('vincity-session');
    const storedStage = localStorage.getItem('vincity-stage') as Stage | null;
    const storedId = localStorage.getItem('vincity-session-id');
    if (stored) {
      try { setSession(JSON.parse(stored)); } catch { /* ignore corrupt storage */ }
    }
    if (storedStage && STAGE_ORDER.includes(storedStage)) {
      setStage(storedStage);
    }
    if (storedId) {
      setSessionId(storedId);
    } else {
      const id = crypto.randomUUID();
      setSessionId(id);
      localStorage.setItem('vincity-session-id', id);
    }
  }, []);

  function saveSession(next: GrantSession, nextStage?: Stage) {
    setSession(next);
    localStorage.setItem('vincity-session', JSON.stringify(next));
    const status = next.draft ? 'draft-ready' : 'in-progress';
    saveApplication({
      id: sessionId || 'default',
      grantName: next.client?.grantName ?? 'Untitled Grant',
      artistName: next.client?.artistName ?? 'Unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status,
      session: next,
    });
    if (nextStage) {
      setStage(nextStage);
      localStorage.setItem('vincity-stage', nextStage);
    }
  }

  function goToStage(s: Stage) {
    setStage(s);
    localStorage.setItem('vincity-stage', s);
  }

  function handleAddSource(source: IngestedSource) {
    const sources = [...session.sources, source];
    saveSession({ ...session, sources, grantText: buildGrantText(sources) });
  }

  function handleRemoveSource(id: string) {
    const sources = session.sources.filter((s) => s.id !== id);
    saveSession({ ...session, sources, grantText: buildGrantText(sources) });
  }

  function handleClientSubmit(profile: ClientProfile) {
    saveSession({ ...session, client: profile, conversation: [], draft: null }, 'interview');
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
    if (s === 'interview') return !!session.client;
    if (s === 'draft') return session.conversation.length > 0;
    return false;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Top bar */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-[#C9A84C] uppercase">VinCity</span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-400">Grant Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-neutral-400 hover:text-[#C9A84C] transition-colors"
            >
              My Applications
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('vincity-session');
                localStorage.removeItem('vincity-stage');
                localStorage.removeItem('vincity-session-id');
                const id = crypto.randomUUID();
                setSessionId(id);
                localStorage.setItem('vincity-session-id', id);
                setSession(EMPTY_SESSION);
                setStage('ingest');
              }}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              New session
            </button>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Stage progress tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900">
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
                      ? 'text-[#C9A84C]'
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
                      isActive ? 'border-[#C9A84C]' : 'border-transparent',
                    ].join(' ')}
                  >
                    {isDone && <span className="mr-1 text-[#C9A84C]">✓</span>}
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
        <div className="border-b border-neutral-800/50 bg-[#0f0f0f]">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-2">
            <button
              onClick={() => currentIndex > 0 && goToStage(STAGE_ORDER[currentIndex - 1])}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 disabled:opacity-0 transition-colors"
            >
              ← {currentIndex > 0 ? STAGE_LABELS[STAGE_ORDER[currentIndex - 1]] : ''}
            </button>
            <span className="text-xs text-neutral-700">{currentIndex + 1} / {STAGE_ORDER.length}</span>
            <button
              onClick={() => {
                const next = STAGE_ORDER[currentIndex + 1];
                if (next && canNavigateTo(next)) goToStage(next);
              }}
              disabled={currentIndex >= STAGE_ORDER.length - 1 || !canNavigateTo(STAGE_ORDER[currentIndex + 1])}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 disabled:opacity-0 transition-colors"
            >
              {currentIndex < STAGE_ORDER.length - 1 ? STAGE_LABELS[STAGE_ORDER[currentIndex + 1]] : ''} →
            </button>
          </div>
        </div>
      )}

      {/* Stage content */}
      <main className={['mx-auto max-w-4xl px-6', stage === 'interview' ? 'py-4' : 'py-10'].join(' ')}>
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
            initial={session.client ?? undefined}
            onSubmit={handleClientSubmit}
            onBack={() => goToStage('ingest')}
          />
        )}

        {stage === 'interview' && session.client && (
          <InterviewChat
            grantText={session.grantText}
            clientProfile={session.client}
            initialHistory={session.conversation}
            onComplete={handleInterviewComplete}
            onBack={() => goToStage('intake')}
          />
        )}

        {stage === 'interview' && !session.client && (
          <div className="text-center text-neutral-500">
            <p>Missing client profile.</p>
            <button onClick={() => goToStage('intake')} className="mt-3 text-sm text-[#C9A84C]">
              ← Go to Intake
            </button>
          </div>
        )}

        {stage === 'draft' && session.client && (
          <DraftView
            grantText={session.grantText}
            clientProfile={session.client}
            conversation={session.conversation}
            initialDraft={session.draft}
            onDraftReady={handleDraftReady}
            onBack={() => goToStage('interview')}
          />
        )}

        {stage === 'draft' && !session.client && (
          <div className="text-center text-neutral-500">
            <p>Missing session data.</p>
            <button onClick={() => goToStage('ingest')} className="mt-3 text-sm text-[#C9A84C]">
              ← Start over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
