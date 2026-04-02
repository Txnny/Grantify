interface Props {
  role: 'assistant' | 'user';
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, isStreaming = false }: Props) {
  const isAI = role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {/* VC avatar — AI side only */}
      {isAI && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-black">
          VC
        </div>
      )}

      <div
        className={[
          'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isAI
            ? 'rounded-tl-sm bg-neutral-800 text-neutral-100'
            : 'rounded-tr-sm bg-[#C9A84C]/15 text-white',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[#C9A84C] align-text-bottom" />
          )}
        </p>
      </div>

      {/* Spacer for user side to mirror avatar */}
      {!isAI && <div className="w-7 shrink-0" />}
    </div>
  );
}
