import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { youtubeSearch } from '../controllers/youtubeController.js';

const router = Router();
router.get('/', requireAuth, youtubeSearch);

export default router;
