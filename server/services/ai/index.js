// Picks the AI provider named in AI_PROVIDER. To add another one (OpenAI, Groq, ...),
// create a file with the same generateText/textToSpeech functions and register it here.
import { env } from '../../config/env.js';
import * as gemini from './geminiProvider.js';

const providers = { gemini };

const provider = providers[env.aiProvider];
if (!provider) {
  throw new Error(`Unknown AI_PROVIDER "${env.aiProvider}". Available: ${Object.keys(providers).join(', ')}`);
}

export const generateText = (prompt, options) => provider.generateText(prompt, options);
export const textToSpeech = (text, options) => provider.textToSpeech(text, options);
