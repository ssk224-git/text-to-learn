// Reads settings from server/.env (locally) or from the host's environment (Render).
// Every other file imports settings from here, so there is one place to look.
import 'dotenv/config';

const clean = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);

export const env = {
  port: Number(clean(process.env.PORT)) || 5000,
  nodeEnv: clean(process.env.NODE_ENV) || 'development',
  mongoUri: clean(process.env.MONGO_URI),
  clientOrigins: (clean(process.env.CLIENT_ORIGIN) || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),

  aiProvider: clean(process.env.AI_PROVIDER) || 'gemini',
  geminiKey: clean(process.env.GEMINI_API_KEY),
  geminiModel: clean(process.env.GEMINI_MODEL) || 'gemini-2.5-flash',
  geminiTtsModel: clean(process.env.GEMINI_TTS_MODEL) || 'gemini-2.5-flash-preview-tts',

  youtubeKey: clean(process.env.YOUTUBE_API_KEY),

  auth0Issuer: clean(process.env.AUTH0_ISSUER),
  auth0Audience: clean(process.env.AUTH0_AUDIENCE),
};

// Login is switched on only when both Auth0 values are present.
export const authEnabled = Boolean(env.auth0Issuer && env.auth0Audience);
