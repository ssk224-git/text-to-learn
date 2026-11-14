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
  // Comma-separated list: the first model is used, the next ones are backups for when
  // a model is overloaded (503), rate-limited (429) or retired (404).
  geminiModels: (clean(process.env.GEMINI_MODEL) || 'gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  geminiTtsModel: clean(process.env.GEMINI_TTS_MODEL) || 'gemini-omni-flash-preview',
  // How much hidden "thinking" the model does. "low" cut tokens ~56% but lessons felt thinner,
  // so lessons get "medium" and quick tasks (outline, Hinglish) get "low". "off" = model default.
  geminiThinkingLevel: clean(process.env.GEMINI_THINKING_LEVEL) || 'low',
  geminiLessonThinkingLevel: clean(process.env.GEMINI_LESSON_THINKING_LEVEL) || 'medium',

  youtubeKey: clean(process.env.YOUTUBE_API_KEY),

  auth0Issuer: clean(process.env.AUTH0_ISSUER),
  auth0Audience: clean(process.env.AUTH0_AUDIENCE),
};

// Login is switched on only when both Auth0 values are present.
export const authEnabled = Boolean(env.auth0Issuer && env.auth0Audience);
