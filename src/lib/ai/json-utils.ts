export function extractJsonObject(raw: string): string {
  // Remove common wrappers
  let text = raw.trim();
  text = text.replace(/^```[a-zA-Z0-9_-]*\s*/g, '');
  text = text.replace(/```\s*$/g, '');

  // Fast path: direct parse
  try {
    JSON.parse(text);
    return text;
  } catch {
    // continue
  }

  // Extract the largest balanced JSON object by scanning braces.
  // This avoids issues where the model outputs trailing text after the JSON.
  const startIdx = text.indexOf('{');
  if (startIdx === -1) {
    throw new Error('No JSON object found.');
  }

  let depth = 0;
  let endIdx = -1;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }

  if (endIdx === -1) {
    throw new Error('Unterminated JSON object.');
  }

  return text.slice(startIdx, endIdx + 1);
}

export function safeJsonParse<T>(raw: string): T {
  const candidate = extractJsonObject(raw);
  try {
    return JSON.parse(candidate) as T;
  } catch (err) {
    const preview = candidate.slice(0, 2000);
    throw new Error(`Invalid JSON from AI response. Error=${String((err as Error)?.message)} Preview=${preview}`);
  }
}

