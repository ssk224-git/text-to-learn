import { Link, NavLink } from 'react-router';
import { BookOpen, Plus, X, LoaderCircle } from 'lucide-react';
import { useCourses } from '../context/CoursesContext.jsx';

export default function Sidebar({ open, onClose }) {
  const { courses, loading } = useCourses();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500">
              <BookOpen size={18} />
            </span>
            Text-to-Learn
          </Link>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <Link to="/" className="btn-primary w-full py-2.5">
            <Plus size={16} /> New course
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="My courses">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">My courses</p>
          {loading && courses.length === 0 && (
            <p className="flex items-center gap-2 px-2 text-sm text-slate-500">
              <LoaderCircle size={14} className="animate-spin" /> Loading…
            </p>
          )}
          {!loading && courses.length === 0 && (
            <p className="px-2 text-sm text-slate-500">No courses yet. Create your first one!</p>
          )}
          <ul className="space-y-0.5">
            {courses.map((c) => (
              <li key={c._id}>
                <NavLink
                  to={`/courses/${c._id}`}
                  className={({ isActive }) =>
                    `block truncate rounded-lg px-3 py-2 text-sm transition ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`
                  }
                >
                  {c.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">MERN + Gemini · Text-to-Learn</div>
      </aside>
    </>
  );
}
