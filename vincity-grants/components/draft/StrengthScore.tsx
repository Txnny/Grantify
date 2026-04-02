import { ApplicationFlag, StrengthScores } from '@/lib/types';

interface Props {
  scores: StrengthScores;
  flags: ApplicationFlag[];
}

const SCORE_LABELS: { key: keyof Omit<StrengthScores, 'overall'>; label: string }[] = [
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'narrative', label: 'Narrative' },
  { key: 'community_impact', label: 'Community Impact' },
  { key: 'financial_viability', label: 'Financial Viability' },
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75 ? '#C9A84C' : value >= 50 ? '#a08030' : '#7a5c20';

  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-neutral-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-700">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-neutral-300">
        {value}
      </span>
    </div>
  );
}

export default function StrengthScore({ scores, flags }: Props) {
  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-5">
      <div className="flex items-start justify-between gap-6">
        {/* Bars */}
        <div className="flex-1 space-y-3">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Application Strength
          </p>
          {SCORE_LABELS.map(({ key, label }) => (
            <ScoreBar key={key} label={label} value={scores[key]} />
          ))}
        </div>

        {/* Overall score */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-6 py-4">
          <span
            className="text-5xl font-bold leading-none text-[#C9A84C]"
            aria-label={`Overall score: ${scores.overall}`}
          >
            {scores.overall}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">
            Overall
          </span>
        </div>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Flags to address
          </p>
          {flags.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-yellow-900/50 bg-yellow-950/30 px-4 py-3"
            >
              <p className="text-xs font-semibold text-yellow-400">{f.issue}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{f.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
