// The AI pipeline: prompt -> model -> parse JSON -> validate -> (retry once with feedback).
import * as ai from './ai/index.js';
import { generateCoursePrompt, generateLessonPrompt, generateHinglishPrompt, retryFeedback } from './prompts.js';
import { extractJson } from '../utils/parseJson.js';
import { normalizeCourse, normalizeLesson, lessonToPlainText } from '../utils/validators.js';
import { AppError } from '../utils/AppError.js';

const MAX_ATTEMPTS = 2;

function summarise(started, calls) {
  const meta = {
    model: calls.at(-1)?.model,
    attempts: calls.length,
    ms: Date.now() - started,
    promptTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };
  for (const c of calls) {
    meta.promptTokens += c.usage.promptTokens;
    meta.outputTokens += c.usage.outputTokens;
    meta.totalTokens += c.usage.totalTokens;
  }
  return meta;
}

// Generic "ask for JSON, check it, retry once" loop used by both course and lesson generation.
async function generateValidated({ basePrompt, normalize, label, temperature }) {
  const started = Date.now();
  const calls = [];
  let prompt = basePrompt;
  let last = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const call = await ai.generateText(prompt, { json: true, temperature });
    calls.push(call);

    let raw;
    try {
      raw = extractJson(call.text);
    } catch {
      prompt = basePrompt + retryFeedback(['The response was not valid JSON']);
      continue;
    }

    if (typeof raw.error === 'string' && raw.error.trim()) {
      throw new AppError(422, raw.error.trim()); // the model refused the topic
    }

    const { value, problems } = normalize(raw);
    last = value;
    if (problems.length === 0) {
      return { value, meta: summarise(started, calls) };
    }
    console.warn(`[ai] ${label} attempt ${attempt} problems:`, problems.join('; '));
    prompt = basePrompt + retryFeedback(problems);
  }

  return { value: last, meta: summarise(started, calls), imperfect: true };
}

export async function generateCourseOutline(topic) {
  const result = await generateValidated({
    basePrompt: generateCoursePrompt(topic),
    normalize: normalizeCourse,
    label: 'course',
    temperature: 0.6,
  });
  if (!result.value?.title || !result.value.modules?.length) {
    throw new AppError(502, "The AI couldn't build a proper course for that topic. Try rephrasing it.");
  }
  console.log(`[ai] course "${result.value.title}" in ${result.meta.ms}ms, ${result.meta.totalTokens} tokens`);
  return result;
}

export async function generateLessonContent(ctx) {
  const result = await generateValidated({
    basePrompt: generateLessonPrompt(ctx),
    normalize: normalizeLesson,
    label: 'lesson',
    temperature: 0.7,
  });
  if (!result.value?.content?.length) {
    throw new AppError(502, "The AI couldn't write this lesson. Please try again.");
  }
  console.log(`[ai] lesson "${ctx.lessonTitle}" in ${result.meta.ms}ms, ${result.meta.totalTokens} tokens`);
  return result;
}

export async function generateHinglishScript(lesson) {
  const call = await ai.generateText(
    generateHinglishPrompt({ lessonTitle: lesson.title, lessonText: lessonToPlainText(lesson) }),
    { temperature: 0.8 }
  );
  const script = call.text.replace(/[*#`]/g, '').trim();
  if (!script) throw new AppError(502, 'The AI returned an empty explanation. Please try again.');
  return script;
}

export const textToSpeech = (text, options) => ai.textToSpeech(text, options);
