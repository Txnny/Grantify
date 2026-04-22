interface Props {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function QuickReplyButtons({ options, onSelect, disabled = false }: Props) {
  if (options.length === 0) return null;

  return (
    <div className="ml-10 mt-2 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className="rounded-full border border-[#C9A84C]/50 px-3 py-1.5 text-xs font-medium text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Parser helper ─────────────────────────────────────────────────────────────

/** Strip OPTIONS line from message text and return { text, options }. */
export function parseOptions(raw: string): { text: string; options: string[] } {
  const optionsRegex = /^OPTIONS:\s*(.+)$/m;
  const match = raw.match(optionsRegex);

  if (!match) return { text: raw.trim(), options: [] };

  const options = match[1]
    .split('|')
    .map((o) => o.trim())
    .filter(Boolean);

  const text = raw.replace(optionsRegex, '').trim();

  return { text, options };
}
