'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SavedApplication } from '@/lib/types';
import { deleteApplication, loadApplications } from '@/lib/storage';

const STATUS_LABEL: Record<SavedApplication['status'], string> = {
  'in-progress': 'In Progress',
  'draft-ready': 'Draft Ready',
  'exported': 'Exported',
};

const STATUS_COLOR: Record<SavedApplication['status'], string> = {
  'in-progress': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'draft-ready': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'exported': 'text-green-400 bg-green-400/10 border-green-400/20',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const router = useRouter();
  const [apps, setApps] = useState<SavedApplication[]>([]);

  useEffect(() => {
    setApps(loadApplications());
  }, []);

  function handleResume(app: SavedApplication) {
    localStorage.setItem('gb-session', JSON.stringify(app.session));
    localStorage.setItem('gb-session-id', app.id);
    const stage = app.session.draft
      ? 'draft'
      : app.session.conversation.length > 0
        ? 'interview'
        : app.session.business
          ? 'interview'
          : app.session.sources.length > 0
            ? 'intake'
            : 'ingest';
    localStorage.setItem('gb-stage', stage);
    router.push('/');
  }

  function handleDelete(id: string) {
    deleteApplication(id);
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="border-b border-blue-900/40 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-blue-400 uppercase">
              Grantify
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-400">My Applications</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            + New Application
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 text-4xl text-neutral-700">📋</div>
            <h2 className="mb-2 text-lg font-semibold text-neutral-300">No applications yet</h2>
            <p className="mb-6 text-sm text-neutral-500">
              Start a new grant application to see it here.
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Start Application
            </button>
          </div>
        ) : (
          <>
            <h1 className="mb-6 text-xl font-semibold text-white">
              Grant Applications
              <span className="ml-2 text-sm font-normal text-neutral-500">({apps.length})</span>
            </h1>
            <div className="space-y-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="group rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="truncate font-medium text-white">{app.grantName}</h3>
                        <span
                          className={[
                            'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                            STATUS_COLOR[app.status],
                          ].join(' ')}
                        >
                          {STATUS_LABEL[app.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-400">{app.companyName}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-600">
                        <span>Created {fmt(app.createdAt)}</span>
                        <span>Updated {fmt(app.updatedAt)}</span>
                        {app.session.sources.length > 0 && (
                          <span>{app.session.sources.length} source{app.session.sources.length > 1 ? 's' : ''}</span>
                        )}
                        {app.session.conversation.length > 0 && (
                          <span>{Math.ceil(app.session.conversation.filter((m) => m.role === 'assistant').length)} Q&amp;A</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleResume(app)}
                        className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                      >
                        {app.status === 'draft-ready' ? 'View Draft' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-500 hover:border-red-800 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      {(['ingest', 'intake', 'interview', 'draft'] as const).map((s, i) => {
                        const stageReached =
                          (s === 'ingest' && app.session.sources.length > 0) ||
                          (s === 'intake' && !!app.session.business) ||
                          (s === 'interview' && app.session.conversation.length > 0) ||
                          (s === 'draft' && !!app.session.draft);
                        const labels = ['Load Grant', 'Intake', 'Interview', 'Draft'];
                        return (
                          <div key={s} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className={[
                                'h-1 w-full rounded-full',
                                stageReached ? 'bg-blue-500' : 'bg-neutral-800',
                              ].join(' ')}
                            />
                            <span className={[
                              'text-[10px]',
                              stageReached ? 'text-blue-400' : 'text-neutral-700',
                            ].join(' ')}>
                              {labels[i]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
