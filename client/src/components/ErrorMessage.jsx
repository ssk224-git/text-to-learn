import { TriangleAlert } from 'lucide-react';

export default function ErrorMessage({ message, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 ${className}`}
    >
      <TriangleAlert size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs font-medium text-red-100 underline hover:text-white">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
