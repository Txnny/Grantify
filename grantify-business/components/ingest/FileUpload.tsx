'use client';

import { useRef, useState } from 'react';
import { IngestedSource } from '@/lib/types';

interface Props {
  onAdd: (source: IngestedSource) => void;
}

const ACCEPTED = '.pdf,.docx';
const MAX_MB = 10;

export default function FileUpload({ onAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Only PDF and DOCX files are supported.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_MB} MB limit.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/ingest/file', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }

      onAdd({
        id: crypto.randomUUID(),
        type: 'file',
        label: data.filename,
        text: data.text,
        filename: data.filename,
      });
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-300">
        Upload PDF or DOCX
      </label>

      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
          isDragging
            ? 'border-[#C9A84C] bg-[#C9A84C]/5'
            : 'border-neutral-700 hover:border-neutral-500',
          loading ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {loading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-[#C9A84C]" />
            <p className="text-sm text-neutral-400">Extracting text…</p>
          </>
        ) : (
          <>
            <svg
              className="h-8 w-8 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-neutral-300">
              Drop a file here, or{' '}
              <span className="text-[#C9A84C]">browse</span>
            </p>
            <p className="text-xs text-neutral-600">PDF or DOCX · max {MAX_MB} MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
