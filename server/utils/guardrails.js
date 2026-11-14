// Input guardrails: the topic box should only ever contain a learning topic.
// These checks run before anything is sent to the AI.

const INJECTION_PATTERNS = [
  /ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)/i,
  /disregard (all |any )?(the )?(previous|prior|above|earlier)/i,
  /(reveal|show|print|repeat) (me )?(your |the )?(system|hidden|initial) (prompt|instructions)/i,
  /\byou are now\b/i,
  /\b(jailbreak|DAN mode|developer mode)\b/i,
  /<\/?(system|assistant|instructions?)>/i,
];

export function checkTopic(input) {
  if (typeof input !== 'string') return { ok: false, reason: 'Please type a topic.' };
  const topic = input.replace(/\s+/g, ' ').trim();

  if (topic.length < 3) {
    return { ok: false, reason: 'Topic is too short. Try something like "Intro to React Hooks".' };
  }
  if (topic.length > 200) {
    return { ok: false, reason: 'Please keep the topic under 200 characters.' };
  }
  if (!/[\p{L}\p{N}]/u.test(topic)) {
    return { ok: false, reason: 'The topic needs some letters or numbers.' };
  }
  if (INJECTION_PATTERNS.some((p) => p.test(topic))) {
    return {
      ok: false,
      reason: 'That looks like instructions for the AI, not a topic. Please type what you want to learn.',
    };
  }
  return { ok: true, topic };
}
