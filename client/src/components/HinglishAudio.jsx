// "Explain in Hinglish": the backend asks Gemini for a teacher-style Hinglish explanation in two scripts:
//   roman      -> easy to read ("React mein useState ek hook hai")
//   devanagari -> what Hindi voices can pronounce ("React में useState एक hook है")
// Audio: Gemini's AI voice when available, otherwise the browser's built-in voices, read sentence by sentence.
import { useEffect, useRef, useState } from 'react';
import { Languages, LoaderCircle, Play, Square, Download } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { slugify } from '../utils/formatText.jsx';

const SPEEDS = [
  { label: 'Slow', rate: 0.75 },
  { label: 'Normal', rate: 0.85 },
  { label: 'Fast', rate: 1 },
];

const isHindi = (v) => v?.lang?.toLowerCase().startsWith('hi');

// Hindi voices first (natural/Google ones on top), then Indian English.
function usefulVoices(all) {
  const score = (v) => (isHindi(v) ? 0 : 10) + (/natural|online|google/i.test(v.name) ? 0 : 1);
  return all.filter((v) => isHindi(v) || v.lang?.toLowerCase() === 'en-in').sort((a, b) => score(a) - score(b));
}

export default function HinglishAudio({ lessonId, lessonTitle }) {
  const api = useApi();
  const [status, setStatus] = useState('idle'); // idle | script | audio | ready | error
  const [scripts, setScripts] = useState(null); // { roman, devanagari }
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(0.85);
  const urlRef = useRef(null);
  const audioRef = useRef(null);

  // Browsers load voices asynchronously.
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return undefined;
    const load = () => {
      const list = usefulVoices(synth.getVoices());
      setVoices(list);
      setVoiceName((current) => current || list[0]?.name || '');
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => {
      synth.removeEventListener?.('voiceschanged', load);
      synth.cancel();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate / 0.85; // "Normal" = 1x for AI audio
  }, [rate, audioUrl]);

  async function start() {
    setError('');
    try {
      setStatus('script');
      const data = await api(`/api/lessons/${lessonId}/hinglish`, { method: 'POST' });
      setScripts(data);
      setStatus('audio');
      try {
        const res = await api(`/api/lessons/${lessonId}/hinglish/audio`, { method: 'POST', body: {}, raw: true });
        const url = URL.createObjectURL(await res.blob());
        urlRef.current = url;
        setAudioUrl(url);
      } catch {
        // AI voice unavailable (e.g. free tier); the browser voice is used instead.
      }
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function play() {
    const synth = window.speechSynthesis;
    if (!synth || !scripts) return;
    synth.cancel();
    const voice = synth.getVoices().find((v) => v.name === voiceName) || null;
    // Hindi voices can pronounce Devanagari; English voices read the Roman version far better.
    const text = isHindi(voice) ? scripts.devanagari : scripts.roman;

    // Chrome stops after ~15 seconds of one long utterance, so speak sentence by sentence.
    const sentences = text.split(/(?<=[।.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-IN'; // no Hindi voice: read the Roman text as Indian English
      u.rate = rate;
      if (i === sentences.length - 1) u.onend = () => setSpeaking(false);
      u.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') setSpeaking(false);
      };
      synth.speak(u);
    });
    setSpeaking(true);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  const busy = status === 'script' || status === 'audio';
  const hasHindiVoice = voices.some(isHindi);

  return (
    <>
      {status !== 'ready' && (
        <button onClick={start} disabled={busy} className="btn-secondary">
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Languages size={16} />}
          {status === 'script' ? 'Writing explanation…' : status === 'audio' ? 'Preparing audio…' : 'Explain in Hinglish'}
        </button>
      )}

      {status === 'error' && <p className="basis-full text-sm text-red-300">{error}</p>}

      {status === 'ready' && scripts && (
        <div className="card basis-full space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Languages size={16} className="text-indigo-400" /> Hinglish explanation
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {audioUrl ? (
              <>
                <audio ref={audioRef} controls src={audioUrl} className="h-10 w-full max-w-md" />
                <a href={audioUrl} download={`${slugify(lessonTitle)}-hinglish.wav`} className="btn-secondary px-3 py-2 text-xs">
                  <Download size={14} /> Download audio
                </a>
              </>
            ) : (
              <button onClick={speaking ? stop : play} className="btn-primary">
                {speaking ? <Square size={14} /> : <Play size={14} />}
                {speaking ? 'Stop' : 'Listen'}
              </button>
            )}

            <div className="flex overflow-hidden rounded-lg border border-slate-700 text-xs" role="group" aria-label="Speed">
              {SPEEDS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setRate(s.rate);
                    if (speaking) stop();
                  }}
                  className={`px-3 py-2 transition ${rate === s.rate ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {!audioUrl && voices.length > 0 && (
              <select
                value={voiceName}
                onChange={(e) => {
                  setVoiceName(e.target.value);
                  if (speaking) stop();
                }}
                className="max-w-60 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-300"
                aria-label="Voice"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name.replace(/^Microsoft /, '').replace(/ - .*$/, '')} ({isHindi(v) ? 'Hindi' : 'English-India'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {!audioUrl && !hasHindiVoice && (
            <p className="text-xs text-amber-300">
              No Hindi voice was found in this browser, so an English voice reads the Roman text. For the most natural
              Hindi voice, open this site in Microsoft Edge (voice "Swara") or Google Chrome (voice "Google हिन्दी").
            </p>
          )}

          <p className="whitespace-pre-line text-[15px] leading-8 text-slate-200">{scripts.roman}</p>
        </div>
      )}
    </>
  );
}
