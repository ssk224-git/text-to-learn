// Talks to Google Gemini. Every provider file exposes the same two functions
// (generateText, textToSpeech), so the rest of the app doesn't care which AI is used.
import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { pcmToWav } from '../../utils/wav.js';

let client;
function getClient() {
  if (!env.geminiKey) {
    throw new AppError(503, 'GEMINI_API_KEY is not set on the server. Add it to server/.env');
  }
  client ??= new GoogleGenAI({ apiKey: env.geminiKey, httpOptions: { timeout: 120_000 } });
  return client;
}

function friendlyError(err, model) {
  if (err instanceof AppError) return err;
  const status = Number(err?.status ?? err?.code);
  const message = String(err?.message || '');
  if (status === 429) return new AppError(429, 'The AI is busy right now (rate limit). Wait a minute and try again.');
  if (status === 401 || status === 403 || /api key/i.test(message)) {
    return new AppError(502, 'The Gemini API key was rejected. Check GEMINI_API_KEY in server/.env');
  }
  if (status === 404) return new AppError(502, `The AI model "${model}" was not found. Set GEMINI_MODEL in server/.env`);
  if (status >= 500) return new AppError(503, 'The AI service is having trouble. Please try again shortly.');
  if (/timed? ?out|abort/i.test(message)) return new AppError(504, 'The AI took too long to answer. Please try again.');
  return err;
}

// Errors worth trying the next model for: overloaded, rate-limited, retired, timed out.
const RETRYABLE = new Set([404, 429, 500, 503, 504]);
const isRetryable = (err) => RETRYABLE.has(Number(err?.status ?? err?.code)) || /timed? ?out|abort/i.test(String(err?.message));

// Models that rejected the thinking setting; we stop sending it to them.
const noThinkingSupport = new Set();

async function callModel(model, prompt, { json, temperature, thinking }) {
  const level = thinking || env.geminiThinkingLevel;
  const useThinking = level !== 'off' && !noThinkingSupport.has(`${model}:${level}`);
  const config = {
    temperature,
    ...(json ? { responseMimeType: 'application/json' } : {}),
    ...(useThinking ? { thinkingConfig: { thinkingLevel: level } } : {}),
    httpOptions: { timeout: 120_000 },
  };
  try {
    return await getClient().models.generateContent({ model, contents: prompt, config });
  } catch (err) {
    if (useThinking && Number(err?.status) === 400 && /think/i.test(String(err?.message))) {
      noThinkingSupport.add(`${model}:${level}`); // this model rejects this level: use its default
      return callModel(model, prompt, { json, temperature, thinking: 'off' });
    }
    throw err;
  }
}

export async function generateText(prompt, { json = false, temperature = 0.7, thinking } = {}) {
  let lastError;
  for (const model of env.geminiModels) {
    try {
      const response = await callModel(model, prompt, { json, temperature, thinking });
      const usage = response.usageMetadata || {};
      return {
        text: response.text ?? '',
        model,
        usage: {
          promptTokens: usage.promptTokenCount || 0,
          outputTokens: (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0),
          totalTokens: usage.totalTokenCount || 0,
        },
      };
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) break;
      console.warn(`[ai] ${model} failed (${err.status ?? err.message}); trying the next model`);
    }
  }
  throw friendlyError(lastError, env.geminiModels.join(', '));
}

// After a quota/permission error, skip the voice model for a while instead of failing on every click.
// (On Gemini's free tier the audio models have no quota, so the browser voice is used instead.)
let ttsBlockedUntil = 0;

export async function textToSpeech(text, { voice = 'Kore' } = {}) {
  const model = env.geminiTtsModel;
  if (Date.now() < ttsBlockedUntil) throw new AppError(503, 'AI voice is unavailable right now.');
  try {
    const response = await getClient().models.generateContent({
      model,
      contents: [{ parts: [{ text: `Read this aloud like a warm, friendly teacher, at a calm pace:\n\n${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part) throw new AppError(502, 'The AI returned no audio.');
    const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || '')?.[1]) || 24000;
    return pcmToWav(Buffer.from(part.inlineData.data, 'base64'), { sampleRate: rate });
  } catch (err) {
    if ([400, 403, 429].includes(Number(err?.status))) ttsBlockedUntil = Date.now() + 30 * 60 * 1000;
    throw friendlyError(err, model);
  }
}
