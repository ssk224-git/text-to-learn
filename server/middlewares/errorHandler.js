import mongoose from 'mongoose';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express calls this whenever a route throws. It turns any error into clean JSON.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = Number(err.status || err.statusCode) || 500;
  let message = err.message || 'Something went wrong.';

  if (/MongoServerSelectionError|MongoNetworkError|MongoNotConnectedError/.test(err.name)) {
    // Usually: your IP isn't on MongoDB Atlas's Network Access list, or Atlas is briefly down.
    status = 503;
    message = 'The database is unreachable right now. Please try again in a minute.';
    console.warn(`[warn] ${req.method} ${req.path} -> database unreachable (${err.name}). Check Atlas Network Access.`);
    return res.status(status).json({ error: message });
  } else if (err instanceof mongoose.Error.CastError) {
    status = 404;
    message = 'Not found (invalid id).';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  } else if (status === 401) {
    message = 'Please log in to continue.';
  }

  if (status >= 500) {
    if (err.expose) {
      // Expected problems (missing key, AI busy): one line is enough.
      console.warn(`[warn] ${req.method} ${req.path} -> ${status}: ${message}`);
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
      if (env.nodeEnv === 'production') message = 'Something went wrong on the server.';
    }
  }

  res.status(status).json({ error: message });
}
