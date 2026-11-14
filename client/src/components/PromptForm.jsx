import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { useCourses } from '../context/CoursesContext.jsx';
import GenerationLoader from './GenerationLoader.jsx';
import ErrorMessage from './ErrorMessage.jsx';

const EXAMPLES = [
  'Intro to React Hooks',
  'Basics of Copyright Law',
  'Pointers in C++',
  'How the stock market works',
  'Photosynthesis for Class 10',
];

export default function PromptForm() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const api = useApi();
  const navigate = useNavigate();
  const { reload } = useCourses();

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length < 3) {
      setError('Type a topic with at least 3 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const course = await api('/api/courses/generate', { method: 'POST', body: { topic: trimmed } });
      reload();
      navigate(`/courses/${course._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) return <GenerationLoader topic={topic.trim()} />;

  return (
    <form onSubmit={handleSubmit} className="card p-4 sm:p-6">
      <label htmlFor="topic" className="mb-2 block text-sm font-medium text-slate-300">
        What do you want to learn?
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={200}
          autoComplete="off"
          placeholder='e.g. "Intro to React Hooks"'
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
        />
        <button type="submit" className="btn-primary px-6 py-3" disabled={!topic.trim()}>
          <Sparkles size={16} /> Generate course
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="py-1 text-xs text-slate-500">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            type="button"
            key={ex}
            onClick={() => setTopic(ex)}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 transition hover:border-indigo-500 hover:text-indigo-300"
          >
            {ex}
          </button>
        ))}
      </div>
      {error && <ErrorMessage message={error} className="mt-4" />}
    </form>
  );
}
