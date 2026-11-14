import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ onMenu }) {
  const { enabled, isLoading, isAuthenticated, user, login, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="text-slate-400 hover:text-white lg:hidden" aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="flex-1" />

      {!enabled && (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          Dev mode · login off
        </span>
      )}

      {enabled && !isLoading && isAuthenticated && (
        <div className="flex items-center gap-3">
          {user?.picture && (
            <img src={user.picture} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span className="hidden max-w-40 truncate text-sm text-slate-300 sm:inline">{user?.name}</span>
          <button onClick={logout} className="btn-secondary px-3" aria-label="Log out">
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      )}

      {enabled && !isLoading && !isAuthenticated && (
        <button onClick={login} className="btn-primary">
          Log in
        </button>
      )}
    </header>
  );
}
