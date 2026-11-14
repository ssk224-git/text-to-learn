import { checkTopic } from '../utils/guardrails.js';
import { AppError } from '../utils/AppError.js';

export function validateTopic(req, res, next) {
  const result = checkTopic(req.body?.topic);
  if (!result.ok) return next(new AppError(400, result.reason));
  req.body.topic = result.topic;
  next();
}

export function validateLessonPosition(req, res, next) {
  const moduleIndex = Number(req.params.moduleIndex);
  const lessonIndex = Number(req.params.lessonIndex);
  if (!Number.isInteger(moduleIndex) || moduleIndex < 0 || !Number.isInteger(lessonIndex) || lessonIndex < 0) {
    return next(new AppError(400, 'Module and lesson numbers must be whole numbers starting at 0.'));
  }
  req.position = { moduleIndex, lessonIndex };
  next();
}
