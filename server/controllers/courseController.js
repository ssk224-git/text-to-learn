import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import { generateCourseOutline } from '../services/courseGenerator.js';
import { AppError } from '../utils/AppError.js';

// Loads a course only if it belongs to the logged-in user (otherwise 404, so we don't
// reveal that someone else's course exists).
export async function findOwnedCourse(courseId, sub) {
  const course = await Course.findOne({ _id: courseId, creator: sub })
    .populate({ path: 'modules', select: 'title lessons', populate: { path: 'lessons', select: 'title isEnriched' } })
    .lean();
  if (!course) throw new AppError(404, 'Course not found.');
  return course;
}

// POST /api/courses/generate  { topic }
export async function generateCourse(req, res) {
  const { topic } = req.body;
  const { value: outline, meta } = await generateCourseOutline(topic);

  const course = await Course.create({
    title: outline.title,
    description: outline.description,
    tags: outline.tags,
    topic,
    creator: req.user.sub,
    meta,
  });

  for (const mod of outline.modules) {
    const moduleDoc = await Module.create({ title: mod.title, course: course._id });
    const lessons = await Lesson.insertMany(
      mod.lessons.map((title, order) => ({ title, order, module: moduleDoc._id, course: course._id }))
    );
    moduleDoc.lessons = lessons.map((l) => l._id);
    await moduleDoc.save();
    course.modules.push(moduleDoc._id);
  }
  await course.save();

  res.status(201).json(await findOwnedCourse(course._id, req.user.sub));
}

// GET /api/courses  -> the user's courses, newest first
export async function listCourses(req, res) {
  const courses = await Course.find({ creator: req.user.sub })
    .sort({ createdAt: -1 })
    .select('title description tags modules createdAt')
    .populate({ path: 'modules', select: 'lessons' })
    .lean();

  res.json(
    courses.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      tags: c.tags,
      createdAt: c.createdAt,
      modulesCount: c.modules.length,
      lessonsCount: c.modules.reduce((n, m) => n + (m.lessons?.length || 0), 0),
    }))
  );
}

// GET /api/courses/:courseId
export async function getCourse(req, res) {
  res.json(await findOwnedCourse(req.params.courseId, req.user.sub));
}

// DELETE /api/courses/:courseId
export async function deleteCourse(req, res) {
  const course = await Course.findOne({ _id: req.params.courseId, creator: req.user.sub });
  if (!course) throw new AppError(404, 'Course not found.');
  await Lesson.deleteMany({ course: course._id });
  await Module.deleteMany({ course: course._id });
  await course.deleteOne();
  res.status(204).end();
}
