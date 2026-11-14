// "Explain in Hinglish": the backend asks Gemini for a short Hindi + English explanation,
// then turns it into speech. If Gemini's voice isn't available, the browser's built-in
// Hindi voice reads it instead, so the feature always works.
import { useEffect, useRef, useState } from 'react';
import { Languages, LoaderCircle, Play, Square, Download } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { slugify } from '../utils/formatText.jsx';

export default function HinglishAudio({ lessonId, lessonTitle }) {
  const api = useApi();
  const [status, setStatus] = useState('idle'); // idle | script | audio | ready | error
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [showText, setShowText] = useState(false);
  const urlRef = useRef(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      window.speechSynthesis?.cancel();
    },
    []
  );

  async function start() {
    setError('');
    try {
      setStatus('script');
      const { script: text } = await api(`/api/lessons/${lessonId}/hinglish`, { method: 'POST' });
      setScript(text);
      setStatus('audio');
      try {
        const res = await api(`/api/lessons/${lessonId}/hinglish/audio`, { method: 'POST', body: {}, raw: true });
        const url = URL.createObjectURL(await res.blob());
        urlRef.current = url;
        setAudioUrl(url);
      } catch (err) {
        console.warn('Gemini TTS unavailable, using browser voice:', err.message);
      }
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function speakWithBrowser() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = 'hi-IN';
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('hi'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  function stopBrowser() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  const busy = status === 'script' || status === 'audio';

  return (
    <>
      {status !== 'ready' && (
        <button onClick={start} disabled={busy} className="btn-secondary">
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Languages size={16} />}
          {status === 'script' ? 'Writing explanation…' : status === 'audio' ? 'Recording audio…' : 'Explain in Hinglish'}
        </button>
      )}

      {status === 'error' && <p className="basis-full text-sm text-red-300">{error}</p>}

      {status === 'ready' && (
        <div className="card basis-full space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Languages size={16} className="text-indigo-400" /> Hinglish explanation
          </div>
          {audioUrl ? (
            <div className="flex flex-wrap items-center gap-3">
              <audio controls src={audioUrl} className="h-10 w-full max-w-md" />
              <a href={audioUrl} download={`${slugify(lessonTitle)}-hinglish.wav`} className="btn-secondary px-3 py-2 text-xs">
                <Download size={14} /> Download audio
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={speaking ? stopBrowser : speakWithBrowser} className="btn-primary">
                {speaking ? <Square size={14} /> : <Play size={14} />}
                {speaking ? 'Stop' : 'Play'}
              </button>
              <span className="text-xs text-slate-500">Using your browser's voice (AI voice unavailable right now)</span>
            </div>
          )}
          <button onClick={() => setShowText((s) => !s)} className="text-xs text-indigo-300 hover:underline">
            {showText ? 'Hide text' : 'Show text'}
          </button>
          {showText && <p className="whitespace-pre-line text-sm leading-7 text-slate-300">{script}</p>}
        </div>
      )}
    </>
  );
}
