// Finds embeddable YouTube videos for a search query (YouTube Data API v3).
// Results are cached in memory for 24h because each search costs 100 quota units
// and the free daily quota is 10,000 (about 100 searches).
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const cache = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE = 500;

export async function searchVideos(query) {
  if (!env.youtubeKey) {
    throw new AppError(503, 'YouTube search is not configured (YOUTUBE_API_KEY missing).');
  }
  const key = query.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.videos;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    safeSearch: 'strict',
    maxResults: '3',
    q: query,
    key: env.youtubeKey,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded') throw new AppError(503, 'YouTube daily quota used up. Try again tomorrow.');
    throw new AppError(502, `YouTube search failed (${res.status}).`);
  }
  const data = await res.json();
  const videos = (data.items || [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      videoId: item.id.videoId,
      title: decodeEntities(item.snippet?.title || ''),
      channel: item.snippet?.channelTitle || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
    }));

  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), videos });
  return videos;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
