import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-indigo-400">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">That page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
