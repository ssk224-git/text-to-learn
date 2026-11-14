// Limits how often AI endpoints can be called, so one user (or a bot) can't burn the API quota.
import { rateLimit } from 'express-rate-limit';

const handler = (req, res) =>
  res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' });

const FIFTEEN_MIN = 15 * 60 * 1000;

export const courseGenerationLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const aiLimiter = rateLimit({
  windowMs: FIFTEEN_MIN,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
