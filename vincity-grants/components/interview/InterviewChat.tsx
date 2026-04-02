'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientProfile, ConversationMessage } from '@/lib/types';
import MessageBubble from './MessageBubble';
import QuickReplyButtons, { parseOptions } from './QuickReplyButtons';

const COMPLETE_SIGNAL = 'INTERVIEW_COMPLETE';
const MAX_QUESTIONS = 15;

interface Props {
  grantText: string;
  clientProfile: ClientProfile;
  initialHistory: ConversationMessage[];
  onComplete: (history: ConversationMessage[]) => void;
  onBack: () => void;
}

export default function InterviewChat({
  grantText,
  clientProfile,
  initialHistory,
  onComplete,
  onBack,
}: Props) {
  const [history, setHistory] = useState<ConversationMessage[]>(initialHistory);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamBuffer]);

  // Kick off first question on mount
  useEffect(() => {
    if (!hasStarted.current && history.length === 0) {
      hasStarted.current = true;
      askNext([]);
    }
    // If resuming mid-session
    if (!hasStarted.current && history.length > 0) {
      hasStarted.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function askNext(currentHistory: ConversationMessage[]) {
    setIsStreaming(true);
    setStreamBuffer('');
    setError(null);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantText, clientProfile, conversationHistory: currentHistory }),
      });

      if (!res.ok || !res.body) {
        let msg = `Server error (${res.status})`;
        try {
          const text = await res.text();
          // If plain text error (not HTML), use it directly
          if (text && !text.trimStart().startsWith('<')) {
            msg = text;
          } else if (res.status === 500) {
            msg = 'API error — check that ANTHROPIC_API_KEY is set in Vercel environment variables.';
          }
        } catch { /* ignore */ }
        setError(msg);
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamBuffer(accumulated);
      }

      // Check for server-side error marker
      if (accumulated.startsWith('__ERROR__')) {
        setError(accumulated.slice(9) || 'API error — check ANTHROPIC_API_KEY in Vercel.');
        setIsStreaming(false);
        return;
      }

      // Done streaming — commit to history
      const { text, options: _ } = parseOptions(accumulated);
      const isCompleteSignal = text.includes(COMPLETE_SIGNAL);

      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: accumulated,
      };

      const nextHistory = [...currentHistory, aiMessage];
      setHistory(nextHistory);
      setStreamBuffer('');

      if (isCompleteSignal) {
        setIsComplete(true);
      }

      // Auto-advance if max questions reached
      if (nextHistory.filter((m) => m.role === 'assistant').length >= MAX_QUESTIONS) {
        setIsComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function submitAnswer(answer: string) {
    const trimmed = answer.trim();
    if (!trimmed || isStreaming || isComplete) return;

    const userMessage: ConversationMessage = { role: 'user', content: trimmed };
    const nextHistory = [...history, userMessage];

    setHistory(nextHistory);
    setInput('');

    const aiCount = nextHistory.filter((m) => m.role === 'assistant').length;
    if (aiCount < MAX_QUESTIONS) {
      askNext(nextHistory);
    } else {
      setIsComplete(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer(input);
    }
  }

  // Compute quick-reply options from last AI message
  const lastAiMessage = [...history].reverse().find((m) => m.role === 'assistant');
  const { text: lastAiText, options: quickOptions } = lastAiMessage
    ? parseOptions(lastAiMessage.content)
    : { text: '', options: [] };

  const questionCount = history.filter((m) => m.role === 'assistant').length;
  const progress = Math.min((questionCount / MAX_QUESTIONS) * 100, 100);

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-neutral-500">
          {questionCount} / {MAX_QUESTIONS}
        </span>
        <button
          onClick={onBack}
          className="shrink-0 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          ← Intake
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-2">
        {history.map((msg, i) => {
          const isLastAi = msg.role === 'assistant' && i === history.length - 1 && !isStreaming;
          const displayContent =
            isLastAi ? lastAiText : parseOptions(msg.content).text;

          return (
            <div key={i}>
              <MessageBubble role={msg.role} content={displayContent} />
              {/* Quick replies only after last AI message, before user replies */}
              {isLastAi && !isComplete && (
                <QuickReplyButtons
                  options={quickOptions}
                  onSelect={submitAnswer}
                  disabled={isStreaming}
                />
              )}
            </div>
          );
        })}

        {/* Streaming bubble */}
        {isStreaming && streamBuffer && (
          <MessageBubble
            role="assistant"
            content={parseOptions(streamBuffer).text}
            isStreaming
          />
        )}

        {/* Thinking indicator */}
        {isStreaming && !streamBuffer && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-black">
              VC
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-neutral-800 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Complete state */}
        {isComplete && !isStreaming && (
          <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 text-center">
            <p className="text-sm font-medium text-[#C9A84C]">Interview complete</p>
            <p className="mt-1 text-xs text-neutral-400">
              Ready to generate your application draft.
            </p>
            <button
              onClick={() => onComplete(history)}
              className="mt-4 rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#b8963f] transition-colors"
            >
              Generate Application →
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {!isComplete && (
        <div className="mt-3 flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => submitAnswer(input)}
            disabled={isStreaming || !input.trim()}
            className="self-end rounded-xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-black hover:bg-[#b8963f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
