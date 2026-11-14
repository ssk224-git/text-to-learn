import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRight, CircleCheck, Circle, Clock, Coins, Layers, Trash2 } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { useCourses } from '../context/CoursesContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function CoursePage() {
  const { courseId } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const { setCourses } = useCourses();
  const { data: course, error, loading, reload } = useAsync(() => api(`/api/courses/${courseId}`), [courseId, api]);

  if (loading) return <LoadingSpinner label="Loading course…" full />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorMessage message={error.message} onRetry={error.status === 404 ? undefined : reload} />
      </div>
    );
  }

  const lessonsCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const doneCount = course.modules.reduce((n, m) => n + m.lessons.filter((l) => l.isEnriched).length, 0);

  async function handleDelete() {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/courses/${course._id}`, { method: 'DELETE' });
      setCourses((list) => list.filter((c) => c._id !== course._id));
      navigate('/');
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="card p-6 sm:p-8">
        {course.tags?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {course.tags.map((t) => (
              <span key={t} className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-300">#{t}</span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{course.title}</h1>
        <p className="mt-3 leading-7 text-slate-400">{course.description}</p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
          <span className="flex items-center gap-1.5"><Layers size={15} /> {course.modules.length} modules · {lessonsCount} lessons</span>
          <span className="flex items-center gap-1.5"><CircleCheck size={15} /> {doneCount} of {lessonsCount} lessons generated</span>
          {course.meta?.ms && (
            <span className="flex items-center gap-1.5"><Clock size={15} /> outline in {(course.meta.ms / 1000).toFixed(1)}s</span>
          )}
          {course.meta?.totalTokens > 0 && (
            <span className="flex items-center gap-1.5"><Coins size={15} /> {course.meta.totalTokens.toLocaleString()} tokens</span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/courses/${course._id}/module/0/lesson/0`} className="btn-primary px-5 py-2.5">
            {doneCount > 0 ? 'Continue learning' : 'Start learning'} <ArrowRight size={16} />
          </Link>
          <button onClick={handleDelete} className="btn-secondary hover:border-red-500/50 hover:text-red-300">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      <ol className="mt-8 space-y-4">
        {course.modules.map((m, mi) => (
          <li key={m._id} className="card p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Module {mi + 1}</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{m.title}</h2>
            <ul className="mt-4 divide-y divide-slate-800">
              {m.lessons.map((l, li) => (
                <li key={l._id}>
                  <Link
                    to={`/courses/${course._id}/module/${mi}/lesson/${li}`}
                    className="group flex items-center gap-3 py-3 text-sm text-slate-300 transition hover:text-white"
                  >
                    {l.isEnriched ? (
                      <CircleCheck size={18} className="shrink-0 text-emerald-400" />
                    ) : (
                      <Circle size={18} className="shrink-0 text-slate-600" />
                    )}
                    <span className="text-slate-500">{mi + 1}.{li + 1}</span>
                    <span className="flex-1">{l.title}</span>
                    <ArrowRight size={16} className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-indigo-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
