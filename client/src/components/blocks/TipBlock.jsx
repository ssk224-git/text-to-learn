import { Lightbulb } from 'lucide-react';
import { formatInline } from '../../utils/formatText.jsx';

export default function TipBlock({ text }) {
  return (
    <aside className="flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
      <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
      <p>{formatInline(text)}</p>
    </aside>
  );
}
