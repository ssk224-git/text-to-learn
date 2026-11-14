import { LoaderCircle } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading…', full = false }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-3 text-sm text-slate-400 ${full ? 'min-h-[50vh]' : 'py-10'}`}
    >
      <LoaderCircle size={18} className="animate-spin text-indigo-400" />
      {label}
    </div>
  );
}
