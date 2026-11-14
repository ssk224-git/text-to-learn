// Entry point: sets up Express, connects to MongoDB, starts listening.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, authEnabled } from './config/env.js';
import { connectDB } from './config/db.js';
import courseRoutes from './routes/courseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.set('trust proxy', 1); // Render sits behind a proxy; needed for correct rate limiting
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ name: 'Text-to-Learn API', docs: '/api/health' }));
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    auth: authEnabled ? 'auth0' : 'dev-mode',
    ai: env.aiProvider,
    model: env.geminiModel,
    youtube: Boolean(env.youtubeKey),
  })
);

app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/youtube', youtubeRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB(env.mongoUri)
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`);
      console.log(`Auth: ${authEnabled ? 'Auth0' : 'DEV MODE (no login)'} | AI: ${env.aiProvider} (${env.geminiModel}) | YouTube: ${env.youtubeKey ? 'on' : 'off'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
