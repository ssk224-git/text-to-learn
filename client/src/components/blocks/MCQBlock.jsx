import { useState } from 'react';
import { formatInline } from '../../utils/formatText.jsx';

const letter = (i) => String.fromCharCode(65 + i);

export default function MCQBlock({ question, options = [], answer, explanation, number }) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  const correct = selected === answer;

  return (
    <div className="card p-5">
      <p className="font-medium text-white">
        <span className="mr-2 text-indigo-400">Q{number}.</span>
        {formatInline(question)}
      </p>

      <div className="mt-4 grid gap-2">
        {options.map((opt, i) => {
          let style = 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50';
          if (answered) {
            if (i === answer) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-200';
            else if (i === selected) style = 'border-red-500 bg-red-500/10 text-red-200';
            else style = 'border-slate-800 text-slate-500';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${style}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-xs">
                {letter(i)}
              </span>
              <span>{formatInline(opt)}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`mt-4 rounded-lg p-4 text-sm ${correct ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}
          aria-live="polite"
        >
          <p className="font-semibold">{correct ? 'Correct! 🎉' : `Not quite. The answer is ${letter(answer)}.`}</p>
          {explanation && <p className="mt-1 text-slate-300">{formatInline(explanation)}</p>}
          <button onClick={() => setSelected(null)} className="mt-3 text-xs text-slate-400 underline hover:text-white">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
