// Turns **bold**, `code` and line breaks inside AI text into real elements
// (without using dangerouslySetInnerHTML, so AI output can never inject HTML).
export function formatInline(text, { strongStyle, codeStyle } = {}) {
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return strongStyle ? (
        <strong key={i} style={strongStyle}>{part.slice(2, -2)}</strong>
      ) : (
        <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      );
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return codeStyle ? (
        <code key={i} style={codeStyle}>{part.slice(1, -1)}</code>
      ) : (
        <code key={i} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    const lines = part.split('\n');
    return lines.flatMap((line, j) => (j < lines.length - 1 ? [line, <br key={`${i}-${j}`} />] : [line]));
  });
}

export function slugify(text) {
  return String(text || 'lesson')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
