import { Link } from 'react-router';
import { Trash2, Layers } from 'lucide-react';

export default function CourseCard({ course, onDelete }) {
  return (
    <div className="card group relative flex flex-col p-5 transition hover:border-indigo-500/50 hover:bg-slate-900">
      <Link to={`/courses/${course._id}`} className="absolute inset-0 rounded-2xl" aria-label={`Open ${course.title}`} />
      <h3 className="line-clamp-2 font-semibold text-white">{course.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-slate-400">{course.description}</p>
      {course.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {course.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Layers size={13} /> {course.modulesCount} modules · {course.lessonsCount} lessons
        </span>
        <button
          onClick={() => onDelete(course)}
          className="relative z-10 rounded p-1 text-slate-500 transition hover:text-red-400 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Delete ${course.title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
