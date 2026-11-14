import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

// Wrap a page with this to make it login-only.
export default function RequireAuth({ children }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) return <LoadingSpinner label="Checking your login…" full />;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-white">Please log in</h1>
        <p className="mt-2 text-sm text-slate-400">Your courses are private. Log in to see them.</p>
        <button onClick={login} className="btn-primary mt-6">
          Log in
        </button>
      </div>
    );
  }
  return children;
}
