// LLMs are told to return raw JSON, but sometimes wrap it in ```json fences or add a
// sentence before it. This pulls the JSON object out anyway.
export function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty AI response');
  }
  const attempts = [];
  const trimmed = text.trim();
  attempts.push(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) attempts.push(fenced[1].trim());

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) attempts.push(trimmed.slice(first, last + 1));

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // try the next candidate
    }
  }
  throw new Error('AI response was not valid JSON');
}
