/**
 * Extract the first complete top-level JSON object from a model response.
 * Handles markdown fences and avoids the common bug where lastIndexOf('}')
 * cuts inside a string value that contains a literal "}".
 */
export function stripLeadingMarkdownFence(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '');
  return s.trimStart();
}

/**
 * Walk from the first "{" and return the substring when brace depth returns to 0,
 * respecting JSON string rules (escapes, quotes).
 */
export function extractFirstJsonObject(raw: string): string | null {
  const s = stripLeadingMarkdownFence(raw);
  const start = s.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const c = s[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function parseDraftJson<T>(raw: string): T {
  const json = extractFirstJsonObject(raw);
  if (!json) {
    throw new Error(
      'No complete JSON object found — the model response was likely truncated mid-stream, or contained no JSON.'
    );
  }
  return JSON.parse(json) as T;
}
