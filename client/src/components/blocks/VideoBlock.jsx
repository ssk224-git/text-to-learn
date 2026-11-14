// The AI only gives a search query. We ask our backend to find a matching YouTube video.
// If YouTube isn't set up (or the quota ran out), we show a "search on YouTube" link instead.
import { useEffect, useState } from 'react';
import { CirclePlay, LoaderCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';

export default function VideoBlock({ query }) {
  const api = useApi();
  const [state, setState] = useState({ status: 'loading', videos: [] });
  const [active, setActive] = useState(0);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query || '')}`;

  useEffect(() => {
    let cancelled = false;
    setActive(0);
    api(`/api/youtube?query=${encodeURIComponent(query)}`)
      .then((d) => !cancelled && setState({ status: d.videos?.length ? 'ready' : 'fallback', videos: d.videos || [] }))
      .catch(() => !cancelled && setState({ status: 'fallback', videos: [] }));
    return () => {
      cancelled = true;
    };
  }, [query, api]);

  const video = state.videos[active];

  return (
    <figure className="card overflow-hidden">
      {state.status === 'loading' && (
        <div className="grid aspect-video place-items-center bg-slate-900 text-slate-500">
          <LoaderCircle className="animate-spin" />
        </div>
      )}
      {state.status === 'ready' && (
        <div className="aspect-video bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}`}
            title={video.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
      {state.status === 'fallback' && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noreferrer"
          className="flex aspect-video flex-col items-center justify-center gap-3 bg-slate-900 text-slate-300 transition hover:text-white"
        >
          <CirclePlay size={52} className="text-red-500" />
          <span className="text-sm">Watch explainer videos on YouTube</span>
        </a>
      )}

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
        <span className="min-w-0 truncate">
          {video ? `${video.title} · ${video.channel}` : `Suggested search: “${query}”`}
        </span>
        <a href={searchUrl} target="_blank" rel="noreferrer" className="shrink-0 text-indigo-300 hover:underline">
          More on YouTube ↗
        </a>
      </figcaption>

      {state.videos.length > 1 && (
        <div className="flex gap-2 border-t border-slate-800 p-3">
          {state.videos.map((v, i) => (
            <button
              key={v.videoId}
              onClick={() => setActive(i)}
              className={`overflow-hidden rounded-md border-2 transition ${i === active ? 'border-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
              aria-label={`Play: ${v.title}`}
            >
              <img src={v.thumbnail} alt="" className="h-12 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
