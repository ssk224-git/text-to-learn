import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import { findOwnedCourse } from './courseController.js';
import { generateLessonContent, generateHinglishScript, textToSpeech } from '../services/courseGenerator.js';
import { AppError } from '../utils/AppError.js';

// If two requests ask for the same un-generated lesson at once (React dev mode does this),
// they share one AI call instead of paying twice.
const inFlight = new Map();

function ensureLessonContent(lesson, ctx) {
  if (lesson.isEnriched) return lesson;
  const key = String(lesson._id);
  if (!inFlight.has(key)) {
    const job = (async () => {
      const { value, meta } = await generateLessonContent(ctx);
      lesson.objectives = value.objectives;
      lesson.content = value.content;
      lesson.meta = meta;
      lesson.isEnriched = true;
      lesson.hinglish = undefined;
      lesson.markModified('content');
      await lesson.save();
      return lesson;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, job);
  }
  return inFlight.get(key);
}

function buildNav(course, mi, li) {
  const flat = [];
  course.modules.forEach((m, mIdx) =>
    m.lessons.forEach((l, lIdx) => flat.push({ moduleIndex: mIdx, lessonIndex: lIdx, title: l.title }))
  );
  const i = flat.findIndex((p) => p.moduleIndex === mi && p.lessonIndex === li);
  return { prev: flat[i - 1] || null, next: flat[i + 1] || null, number: i + 1, total: flat.length };
}

// GET /api/courses/:courseId/modules/:moduleIndex/lessons/:lessonIndex
export async function getLesson(req, res) {
  const { moduleIndex: mi, lessonIndex: li } = req.position;
  const course = await findOwnedCourse(req.params.courseId, req.user.sub);
  const mod = course.modules[mi];
  const stub = mod?.lessons[li];
  if (!stub) throw new AppError(404, 'Lesson not found.');

  let lesson = await Lesson.findById(stub._id);
  lesson = await ensureLessonContent(lesson, {
    courseTitle: course.title,
    moduleTitle: mod.title,
    lessonTitle: lesson.title,
    siblingTitles: mod.lessons.map((l) => l.title),
  });
  stub.isEnriched = true; // keep the outline we send back in sync

  res.json({
    lesson: lesson.toObject(),
    course: { _id: course._id, title: course.title, modules: course.modules },
    position: { moduleIndex: mi, lessonIndex: li },
    nav: buildNav(course, mi, li),
  });
}

async function findOwnedLesson(lessonId, sub) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  const course = await Course.exists({ _id: lesson.course, creator: sub });
  if (!course) throw new AppError(404, 'Lesson not found.');
  return lesson;
}

// POST /api/lessons/:lessonId/regenerate
export async function regenerateLesson(req, res) {
  const lesson = await findOwnedLesson(req.params.lessonId, req.user.sub);
  const [course, mod] = await Promise.all([
    Course.findById(lesson.course).select('title').lean(),
    Module.findById(lesson.module).populate('lessons', 'title').lean(),
  ]);
  lesson.isEnriched = false;
  const updated = await ensureLessonContent(lesson, {
    courseTitle: course.title,
    moduleTitle: mod.title,
    lessonTitle: lesson.title,
    siblingTitles: mod.lessons.map((l) => l.title),
  });
  res.json({ lesson: updated.toObject() });
}

async function getOrCreateHinglish(lesson) {
  if (!lesson.isEnriched) throw new AppError(400, 'Open the lesson first so its content exists.');
  // Older lessons cached a single Devanagari string; regenerate those in the new two-script format.
  if (!lesson.hinglish?.roman) {
    lesson.hinglish = await generateHinglishScript(lesson);
    lesson.markModified('hinglish');
    await lesson.save();
  }
  return lesson.hinglish;
}

// POST /api/lessons/:lessonId/hinglish  -> { roman, devanagari }
export async function getHinglishScript(req, res) {
  const lesson = await findOwnedLesson(req.params.lessonId, req.user.sub);
  res.json(await getOrCreateHinglish(lesson));
}

const VOICES = new Set(['Kore', 'Puck', 'Charon', 'Aoede', 'Leda', 'Orus', 'Zephyr']);

// POST /api/lessons/:lessonId/hinglish/audio  -> audio/wav
export async function getHinglishAudio(req, res) {
  const lesson = await findOwnedLesson(req.params.lessonId, req.user.sub);
  const { devanagari } = await getOrCreateHinglish(lesson);
  const voice = VOICES.has(req.body?.voice) ? req.body.voice : 'Kore';
  const wav = await textToSpeech(devanagari, { voice });
  res.set({ 'Content-Type': 'audio/wav', 'Content-Length': wav.length, 'Cache-Control': 'no-store' });
  res.send(wav);
}
