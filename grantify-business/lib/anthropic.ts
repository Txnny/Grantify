import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = 'claude-sonnet-4-6';       // draft quality
export const FAST_MODEL = 'claude-haiku-4-5-20251001'; // interview speed + cost

/**
 * Helper to stream a message from Claude and pipe it to a ReadableStream
 * suitable for use in Next.js API routes (Response).
 */
export function streamToResponse(
  params: Parameters<typeof anthropic.messages.stream>[0]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const stream = anthropic.messages.stream(params);

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }

      controller.close();
    },
  });
}
