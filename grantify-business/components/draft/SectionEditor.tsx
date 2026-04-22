'use client';

import { useState } from 'react';
import { ApplicationSection } from '@/lib/types';

interface Props {
  section: ApplicationSection;
  onSave: (updated: ApplicationSection) => void;
  onCancel: () => void;
}

export default function SectionEditor({ section, onSave, onCancel }: Props) {
  const [content, setContent] = useState(section.content);

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm leading-relaxed text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition-colors"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-neutral-700 px-4 py-2 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...section, content })}
          className="rounded-md bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-black hover:bg-[#b8963f] transition-colors"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
