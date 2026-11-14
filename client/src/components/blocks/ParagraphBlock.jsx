import { formatInline } from '../../utils/formatText.jsx';

export default function ParagraphBlock({ text }) {
  return <p className="leading-7 text-slate-300">{formatInline(text)}</p>;
}
