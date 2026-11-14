import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validateTopic, validateLessonPosition } from '../middlewares/validate.js';
import { courseGenerationLimiter, aiLimiter } from '../middlewares/rateLimit.js';
import { generateCourse, listCourses, getCourse, deleteCourse } from '../controllers/courseController.js';
import { getLesson } from '../controllers/lessonController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listCourses);
router.post('/generate', courseGenerationLimiter, validateTopic, generateCourse);
router.get('/:courseId', getCourse);
router.delete('/:courseId', deleteCourse);
router.get('/:courseId/modules/:moduleIndex/lessons/:lessonIndex', aiLimiter, validateLessonPosition, getLesson);

export default router;
