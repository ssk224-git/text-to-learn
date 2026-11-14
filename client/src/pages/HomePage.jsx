import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCourses } from '../context/CoursesContext.jsx';
import { useApi } from '../hooks/useApi.js';
import PromptForm from '../components/PromptForm.jsx';
import CourseCard from '../components/CourseCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function HomePage() {
  const { isLoading, isAuthenticated, login, signup } = useAuth();
  const { courses, setCourses, loading, error, reload } = useCourses();
  const api = useApi();

  async function handleDelete(course) {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/courses/${course._id}`, { method: 'DELETE' });
      setCourses((list) => list.filter((c) => c._id !== course._id));
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-8 text-center sm:mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
          <Sparkles size={12} /> AI-powered course generator
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Type a topic.{' '}
          <span className="bg-linear-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            Get a full course.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Modules, lessons, code examples, videos and quizzes, generated in seconds. Save your courses, download
          lessons as PDF, and listen to Hinglish explanations.
        </p>
      </section>

      {isLoading ? (
        <LoadingSpinner />
      ) : isAuthenticated ? (
        <PromptForm />
      ) : (
        <div className="card p-8 text-center">
          <p className="text-slate-300">Log in to create and save your courses.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button className="btn-primary" onClick={login}>Log in</button>
            <button className="btn-secondary" onClick={signup}>Sign up</button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-white">Your courses</h2>
          {error ? (
            <ErrorMessage message={error.message} onRetry={reload} />
          ) : loading && courses.length === 0 ? (
            <LoadingSpinner label="Loading your courses…" />
          ) : courses.length === 0 ? (
            <p className="text-sm text-slate-500">No courses yet. Try one of the example topics above.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c._id} course={c} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
