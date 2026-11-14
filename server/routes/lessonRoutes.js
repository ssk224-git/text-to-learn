import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { aiLimiter } from '../middlewares/rateLimit.js';
import { regenerateLesson, getHinglishScript, getHinglishAudio } from '../controllers/lessonController.js';

const router = Router();
router.use(requireAuth, aiLimiter);

router.post('/:lessonId/regenerate', regenerateLesson);
router.post('/:lessonId/hinglish', getHinglishScript);
router.post('/:lessonId/hinglish/audio', getHinglishAudio);

export default router;
