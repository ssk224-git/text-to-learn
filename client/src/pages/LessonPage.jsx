import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Target } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { useAsync } from '../hooks/useAsync.js';
import LessonRenderer from '../components/LessonRenderer.jsx';
import LessonPDFExporter from '../components/LessonPDFExporter.jsx';
import HinglishAudio from '../components/HinglishAudio.jsx';
import CourseOutline from '../components/CourseOutline.jsx';
import GenerationLoader from '../components/GenerationLoader.jsx';
import { formatInline } from '../utils/formatText.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const LESSON_STEPS = [
  'Opening the lesson…',
  'Writing the explanation…',
  'Adding examples…',
  'Finding a video to watch…',
  'Creating quiz questions…',
  'Checking everything…',
];

export default function LessonPage() {
  const { courseId, moduleIndex, lessonIndex } = useParams();
  const api = useApi();
  const [regenerating, setRegenerating] = useState(false);
  const { data, error, loading, reload, setData } = useAsync(
    () => api(`/api/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}`),
    [courseId, moduleIndex, lessonIndex, api]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <GenerationLoader title="Preparing your lesson" steps={LESSON_STEPS} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorMessage message={error.message} onRetry={error.status === 404 ? undefined : reload} />
        <Link to={`/courses/${courseId}`} className="mt-4 inline-block text-sm text-indigo-300 hover:underline">← Back to course</Link>
      </div>
    );
  }

  const { lesson, course, position, nav } = data;
  const module = course.modules[position.moduleIndex];
  const lessonUrl = (p) => `/courses/${courseId}/module/${p.moduleIndex}/lesson/${p.lessonIndex}`;

  async function handleRegenerate() {
    if (!window.confirm('Rewrite this lesson with fresh AI content?')) return;
    setRegenerating(true);
    try {
      const { lesson: fresh } = await api(`/api/lessons/${lesson._id}/regenerate`, { method: 'POST' });
      setData((d) => ({ ...d, lesson: fresh }));
    } catch (err) {
      window.alert(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <article className="min-w-0 flex-1">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
          <Link to={`/courses/${courseId}`} className="hover:text-indigo-300">{course.title}</Link>
          <ChevronRight size={12} />
          <span>Module {position.moduleIndex + 1}: {module.title}</span>
        </nav>
        <p className="text-xs font-medium text-indigo-400">Lesson {nav.number} of {nav.total}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{lesson.title}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <LessonPDFExporter lesson={lesson} courseTitle={course.title} moduleTitle={module.title} />
          <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary" title="Rewrite this lesson">
            {regenerating ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span className="hidden sm:inline">{regenerating ? 'Rewriting…' : 'Regenerate'}</span>
          </button>
          {/* Last in the row: its panel opens full-width below the buttons */}
          <HinglishAudio key={lesson._id + (lesson.updatedAt || '')} lessonId={lesson._id} lessonTitle={lesson.title} />
        </div>

        {lesson.objectives?.length > 0 && (
          <section className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
              <Target size={16} /> What you'll learn
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
              {lesson.objectives.map((o, i) => (
                <li key={i} className="flex gap-2"><span className="text-indigo-400">✓</span><span>{formatInline(o)}</span></li>
              ))}
            </ul>
          </section>
        )}

        <div className={`mt-6 transition ${regenerating ? 'pointer-events-none opacity-40' : ''}`}>
          <LessonRenderer content={lesson.content} />
        </div>

        <div className="mt-10 grid gap-3 border-t border-slate-800 pt-6 sm:grid-cols-2">
          {nav.prev ? (
            <Link to={lessonUrl(nav.prev)} className="card group flex items-center gap-3 p-4 transition hover:border-indigo-500/50">
              <ChevronLeft size={18} className="shrink-0 text-slate-500 group-hover:text-indigo-300" />
              <span className="min-w-0"><span className="block text-xs text-slate-500">Previous</span><span className="block truncate text-sm text-slate-200">{nav.prev.title}</span></span>
            </Link>
          ) : <span />}
          {nav.next && (
            <Link to={lessonUrl(nav.next)} className="card group flex items-center justify-end gap-3 p-4 text-right transition hover:border-indigo-500/50">
              <span className="min-w-0"><span className="block text-xs text-slate-500">Next</span><span className="block truncate text-sm text-slate-200">{nav.next.title}</span></span>
              <ChevronRight size={18} className="shrink-0 text-slate-500 group-hover:text-indigo-300" />
            </Link>
          )}
        </div>

        {lesson.meta?.ms && (
          <p className="mt-6 text-center text-xs text-slate-600">
            Generated by {lesson.meta.model} in {(lesson.meta.ms / 1000).toFixed(1)}s · {lesson.meta.totalTokens?.toLocaleString()} tokens
            {lesson.meta.attempts > 1 && ` · ${lesson.meta.attempts} attempts`}
          </p>
        )}
      </article>

      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6 max-h-[calc(100dvh-7rem)] overflow-y-auto">
          <CourseOutline course={course} active={position} />
        </div>
      </aside>
    </div>
  );
}
