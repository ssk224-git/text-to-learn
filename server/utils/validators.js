// Never trust AI output blindly. These functions clean up what the model returned
// and list any problems, so the caller can retry with feedback.

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const LIMITS = { minModules: 3, maxModules: 6, minLessons: 3, maxLessons: 5 };

export function normalizeCourse(raw) {
  const problems = [];
  if (!raw || typeof raw !== 'object') {
    return { value: null, problems: ['Response is not a JSON object'] };
  }

  const title = str(raw.title).slice(0, 150);
  if (!title) problems.push('Missing "title"');

  const tags = (Array.isArray(raw.tags) ? raw.tags : [])
    .map((t) => str(t).toLowerCase().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 6);

  const modules = (Array.isArray(raw.modules) ? raw.modules : [])
    .map((m) => ({
      title: str(m?.title).slice(0, 150),
      lessons: (Array.isArray(m?.lessons) ? m.lessons : [])
        .map((l) => str(typeof l === 'string' ? l : l?.title).slice(0, 150))
        .filter(Boolean),
    }))
    .filter((m) => m.title && m.lessons.length > 0);

  if (modules.length < LIMITS.minModules) {
    problems.push(`Need ${LIMITS.minModules}-${LIMITS.maxModules} modules, got ${modules.length}`);
  }
  modules.forEach((m, i) => {
    if (m.lessons.length < LIMITS.minLessons) {
      problems.push(`Module ${i + 1} needs ${LIMITS.minLessons}-${LIMITS.maxLessons} lessons, got ${m.lessons.length}`);
    }
    m.lessons = m.lessons.slice(0, LIMITS.maxLessons);
  });

  return {
    value: {
      title,
      description: str(raw.description).slice(0, 600),
      tags,
      modules: modules.slice(0, LIMITS.maxModules),
    },
    problems,
  };
}

function normalizeAnswer(answer, options) {
  if (Number.isInteger(answer)) return answer;
  if (typeof answer === 'string') {
    const s = answer.trim();
    if (/^\d+$/.test(s)) return Number(s);
    if (/^[A-Fa-f]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 65;
    const idx = options.findIndex((o) => o.toLowerCase() === s.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeBlock(block) {
  if (!block || typeof block !== 'object') return null;
  const type = str(block.type).toLowerCase();

  switch (type) {
    case 'heading':
    case 'paragraph': {
      const text = str(block.text);
      return text ? { type, text } : null;
    }
    case 'list': {
      const items = (Array.isArray(block.items) ? block.items : []).map(str).filter(Boolean).slice(0, 10);
      return items.length ? { type, items } : null;
    }
    case 'tip':
    case 'callout':
    case 'note': {
      const text = str(block.text);
      return text ? { type: 'tip', text } : null;
    }
    case 'code': {
      const text = typeof block.text === 'string' ? block.text.replace(/\s+$/, '') : str(block.code);
      return text ? { type, language: str(block.language).toLowerCase() || 'text', text } : null;
    }
    case 'video': {
      const query = str(block.query) || str(block.url) || str(block.text);
      return query ? { type, query: query.slice(0, 120) } : null;
    }
    case 'mcq': {
      const question = str(block.question);
      const options = (Array.isArray(block.options) ? block.options : []).map(str).filter(Boolean).slice(0, 6);
      const answer = normalizeAnswer(block.answer, options);
      if (!question || options.length < 2 || answer < 0 || answer >= options.length) return null;
      return { type, question, options, answer, explanation: str(block.explanation) };
    }
    default: {
      // Unknown block type: keep its text as a paragraph rather than losing it.
      const text = str(block.text);
      return text ? { type: 'paragraph', text } : null;
    }
  }
}

export function normalizeLesson(raw) {
  const problems = [];
  if (!raw || typeof raw !== 'object') {
    return { value: null, problems: ['Response is not a JSON object'] };
  }

  const objectives = (Array.isArray(raw.objectives) ? raw.objectives : [])
    .map(str)
    .filter(Boolean)
    .slice(0, 6);
  if (objectives.length === 0) problems.push('Missing "objectives"');

  let videoSeen = false;
  const content = (Array.isArray(raw.content) ? raw.content : [])
    .map(normalizeBlock)
    .filter(Boolean)
    .filter((b) => {
      if (b.type !== 'video') return true;
      if (videoSeen) return false; // keep only one video per lesson
      videoSeen = true;
      return true;
    });

  const mcqs = content.filter((b) => b.type === 'mcq').length;
  const teaching = content.filter((b) => b.type === 'paragraph').length;
  if (teaching < 3) problems.push(`Lesson needs more explanation (only ${teaching} paragraphs)`);
  if (mcqs < 3) problems.push(`Need 4-5 valid MCQs at the end, got ${mcqs}`);
  if (!videoSeen) problems.push('Missing the video block with a YouTube search query');

  return { value: { title: str(raw.title), objectives, content }, problems };
}

// Checks the two-script Hinglish explanation ({ roman, devanagari }).
export function normalizeHinglish(raw) {
  const roman = str(raw?.roman).replace(/[*#`]/g, '');
  const devanagari = str(raw?.devanagari).replace(/[*#`]/g, '');
  const problems = [];
  if (roman.split(/\s+/).length < 80) problems.push('"roman" explanation is missing or too short');
  if (!/[ऀ-ॿ]/.test(devanagari)) problems.push('"devanagari" must contain Hindi in Devanagari script');
  return { value: { roman, devanagari }, problems };
}

// Plain text version of a lesson (used for the Hinglish explanation prompt).
export function lessonToPlainText(lesson, maxChars = 6000) {
  const lines = [];
  for (const b of lesson.content || []) {
    if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'tip') lines.push(b.text);
    if (b.type === 'list') lines.push(b.items.map((i) => `- ${i}`).join('\n'));
    if (b.type === 'code') lines.push(`[Code example in ${b.language}]\n${b.text.slice(0, 600)}`);
  }
  return lines.join('\n').replace(/\*\*|`/g, '').slice(0, maxChars);
}
