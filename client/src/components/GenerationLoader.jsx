import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const COURSE_STEPS = [
  'Understanding your topic…',
  'Designing the curriculum…',
  'Ordering modules from basics to advanced…',
  'Writing lesson titles…',
  'Checking the structure…',
  'Saving your course…',
];

// A friendly loading screen for slow AI calls, with rotating status messages and a timer.
export default function GenerationLoader({ title = 'Building your course', topic, steps = COURSE_STEPS }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const step = steps[Math.min(Math.floor(seconds / 4), steps.length - 1)];

  return (
    <div className="card flex flex-col items-center gap-5 px-6 py-12 text-center" role="status" aria-live="polite">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
        <div className="relative grid h-14 w-14 place-items-center rounded-full bg-indigo-500 text-white">
          <Sparkles size={24} />
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold text-white">
          {title}
          {topic && (
            <>
              : <span className="text-indigo-300">{topic}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-slate-400">{step}</p>
      </div>
      <p className="text-xs text-slate-500">
        {seconds}s · usually 10–40 seconds
        {seconds > 45 && ' · the free server may be waking up, hang on'}
      </p>
    </div>
  );
}
