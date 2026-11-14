import { Link } from 'react-router';
import { CircleCheck, Circle } from 'lucide-react';

// Compact list of modules and lessons, used beside a lesson. Green tick = lesson already generated.
export default function CourseOutline({ course, active }) {
  return (
    <nav className="card p-4" aria-label="Course outline">
      <Link to={`/courses/${course._id}`} className="block font-semibold text-white hover:text-indigo-300">
        {course.title}
      </Link>
      <ol className="mt-4 space-y-4">
        {course.modules.map((m, mi) => (
          <li key={m._id || mi}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Module {mi + 1}</p>
            <p className="mb-1.5 text-sm font-medium text-slate-300">{m.title}</p>
            <ul className="space-y-0.5">
              {m.lessons.map((l, li) => {
                const isActive = active?.moduleIndex === mi && active?.lessonIndex === li;
                return (
                  <li key={l._id || li}>
                    <Link
                      to={`/courses/${course._id}/module/${mi}/lesson/${li}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-200'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {l.isEnriched ? (
                        <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle size={14} className="mt-0.5 shrink-0 text-slate-600" />
                      )}
                      <span>{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </nav>
  );
}
