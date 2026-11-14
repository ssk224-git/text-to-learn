import { formatInline } from '../../utils/formatText.jsx';

export default function ListBlock({ items = [] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 leading-7 text-slate-300">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
          <span>{formatInline(item)}</span>
        </li>
      ))}
    </ul>
  );
}
