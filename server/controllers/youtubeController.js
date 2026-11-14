import { searchVideos } from '../services/youtubeService.js';
import { AppError } from '../utils/AppError.js';

// GET /api/youtube?query=...
export async function youtubeSearch(req, res) {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  if (!query || query.length > 120) throw new AppError(400, 'A search query (max 120 characters) is required.');
  res.json({ videos: await searchVideos(query) });
}
