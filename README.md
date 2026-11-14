# Text-to-Learn: AI-Powered Course Generator

Type any topic (*"Intro to React Hooks"*, *"Basics of Copyright Law"*) and get a complete, structured online course: 3–6 modules, 3–5 lessons each, with explanations, code examples, a YouTube video, quizzes, PDF download and a Hinglish audio explanation.

![CI](https://github.com/OWNER/text-to-learn/actions/workflows/ci.yml/badge.svg)

> **Live demo:** _add your Vercel URL here_ · **API:** _add your Render URL here_ · **Demo video:** _add link_

<!-- Add screenshots: docs/home.png, docs/course.png, docs/lesson.png -->

## Features

| Feature | How it works |
|---|---|
| **Prompt → course** | Gemini designs a curriculum (title, description, tags, modules, lesson titles) returned as strict JSON |
| **Lessons on demand** | Only the outline is generated up front. Each lesson is written the first time someone opens it, then saved, so it's never paid for twice |
| **Rich lesson blocks** | Headings, paragraphs (bold/inline code), bullet lists, tip boxes, syntax-highlighted code with a line-by-line walkthrough, YouTube video, interactive MCQs with explanations |
| **Teaching-quality prompt** | Every lesson defines new terms, explains *why* before *how*, uses an everyday analogy and a worked example, and ends with "Common mistakes" and "Key takeaways" |
| **YouTube videos** | The AI writes a search query; the backend calls the YouTube Data API (results cached 24h to protect the 10k/day quota) |
| **Download as PDF** | A print-styled copy is captured with html2canvas-pro and paginated with jsPDF, breaking only *between* blocks |
| **Hinglish explanation** | Gemini writes a teacher-style explanation in two scripts: Roman Hinglish to read, and Devanagari for Hindi voices. Gemini TTS reads it, or the browser's voices (with voice picker and slow/normal/fast speed) when AI audio isn't available |
| **Secure login** | Auth0 (OAuth 2.0 + JWT). The API verifies the token and only shows you your own courses |
| **Dev mode** | Without Auth0/YouTube keys the app still runs (no login, "search on YouTube" link) so you can develop first |

## Reliability and safety (the part that took the most work)

- **Validated AI output:** every response is parsed (even if wrapped in code fences), normalised and checked (module and lesson counts, valid MCQ answer index, exactly one video). If something is wrong, the model is retried **once with a list of the exact problems**.
- **Model fallback:** a comma-separated model list. If a model is overloaded (503), rate-limited (429), retired (404) or times out, the next one is tried automatically.
- **Prompt-injection guardrails:** topics like *"ignore previous instructions…"* are rejected before reaching the AI, and the topic is passed to the model inside `<topic>` tags as data.
- **The model can refuse:** harmful or unteachable topics return `{"error": "..."}`, which is shown as a friendly 422.
- **Rate limiting:** 10 course generations and 120 AI calls per 15 minutes per IP.
- **Duplicate-call protection:** two simultaneous requests for the same new lesson share one AI call.
- **No HTML injection:** AI text is rendered as React elements, never `dangerouslySetInnerHTML`.
- **Keys stay server-side:** the YouTube and Gemini keys never reach the browser.

## Measured results

Measured locally on Gemini 3.6/3.5 Flash (Nov 2026). Small samples, and latency varies a lot with Google's load:

| Metric | Result |
|---|---|
| Course outline (5 modules, 20 lessons) | 39 s · 1,478 tokens |
| Lesson, default thinking (3 lessons) | 24–114 s · avg 5,158 tokens |
| Lesson, `thinkingLevel: low` (2 lessons) | **12–25 s · avg 2,292 tokens (56% fewer tokens)** |
| Lessons passing validation on the first attempt | 5 / 5 |
| Overloaded model handled by automatic fallback | 1 (3.6 Flash timed out → 3.5 Flash finished it) |
| PDF export of a ~900-word lesson | 4 A4 pages |
| Backend unit tests (parsing, validation, guardrails) | 5 / 5 passing in CI |

## Architecture

```
React (Vite, Tailwind)                     Express API (Node)                     External
┌──────────────────────┐   fetch + JWT   ┌─────────────────────────────┐
│ PromptForm           │ ──────────────▶ │ auth → rate limit → validate │
│ CoursePage           │                 │ controllers                  │──▶ MongoDB Atlas
│ LessonPage           │ ◀────────────── │ services/courseGenerator     │──▶ Gemini (text, TTS)
│  └ LessonRenderer    │      JSON       │   prompt → model → parse →   │──▶ YouTube Data API
│     └ blocks/*       │                 │   validate → retry           │
└──────────────────────┘                 └─────────────────────────────┘
        ▲ Auth0 login (redirect)                ▲ verifies Auth0 JWT (RS256)
```

**Data model:** `Course 1──< Module 1──< Lesson`. A lesson starts as a title stub (`isEnriched: false`) and gets its `content` blocks on first view.

## Tech stack

**Frontend:** React 19, Vite, Tailwind CSS v4, React Router, Auth0 React SDK, react-syntax-highlighter, jsPDF, html2canvas-pro, lucide-react
**Backend:** Node.js, Express 5, MongoDB + Mongoose, @google/genai, express-oauth2-jwt-bearer, helmet, express-rate-limit
**Infra:** Vercel (frontend), Render (backend), GitHub Actions (tests + build on every push)

## Run it locally

You need Node 20+, a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster and a [Gemini API key](https://aistudio.google.com).

```bash
# 1. Backend
cd server
cp .env.example .env      # then fill in MONGO_URI and GEMINI_API_KEY
npm install
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173

# Tests
cd server && npm test
```

### Environment variables

| Server (`server/.env`) | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string (URL-encode special characters in the password) |
| `GEMINI_API_KEY` | Google AI Studio key |
| `GEMINI_MODEL` | Optional comma-separated model list (first = main, rest = fallbacks) |
| `GEMINI_THINKING_LEVEL` | `low` (default) or `off` |
| `YOUTUBE_API_KEY` | Optional: YouTube Data API v3 key |
| `AUTH0_ISSUER`, `AUTH0_AUDIENCE` | Optional: enables login (leave empty for dev mode) |
| `CLIENT_ORIGIN` | Allowed frontend URL(s), comma-separated |

| Client (`client/.env`) | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL |
| `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE` | Optional: enables login |

## API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/courses/generate` | `{ topic }` → generates and saves a course outline |
| `GET` | `/api/courses` | The logged-in user's courses |
| `GET` | `/api/courses/:id` | One course with modules and lesson titles |
| `DELETE` | `/api/courses/:id` | Delete a course and its modules/lessons |
| `GET` | `/api/courses/:id/modules/:m/lessons/:l` | A lesson (generated on first request) plus prev/next navigation |
| `POST` | `/api/lessons/:id/regenerate` | Rewrite a lesson |
| `POST` | `/api/lessons/:id/hinglish` | Hinglish explanation script |
| `POST` | `/api/lessons/:id/hinglish/audio` | Hinglish explanation as `audio/wav` |
| `GET` | `/api/youtube?query=` | Embeddable YouTube videos for a query |
| `GET` | `/api/health` | Status, auth mode, models in use |

## Deployment

- **Backend → Render:** New Web Service → root directory `server` → build `npm install` → start `npm start` → add the server env vars (set `CLIENT_ORIGIN` to your Vercel URL).
- **Frontend → Vercel:** Import the repo → root directory `client` → add `VITE_API_URL` (your Render URL) and the Auth0 vars. `vercel.json` handles client-side routes.
- **Auth0:** add your Vercel URL to *Allowed Callback URLs*, *Allowed Logout URLs* and *Allowed Web Origins*. Turn on *Refresh Token Rotation* (application) and *Allow Offline Access* (API).
- **CI/CD:** GitHub Actions runs server tests and the client build on every push and PR; Render and Vercel redeploy automatically from `main`.

## Project structure

```
server/
  server.js            entry point
  config/              env + database connection
  models/              Mongoose schemas (User, Course, Module, Lesson)
  routes/ controllers/ HTTP layer
  middlewares/         auth, validation, rate limits, error handling
  services/            AI pipeline, prompts, YouTube
  utils/               JSON parsing, validators, guardrails, WAV encoding
  tests/               node:test unit tests
client/src/
  pages/               Home, Course, Lesson, 404
  components/          layout, forms, LessonRenderer, PDF exporter, Hinglish audio
  components/blocks/   one component per lesson block type
  context/ hooks/      auth, courses list, API helpers
```

## Built with

Built with AI assistance (Claude Code) as a learning project. See [LEARNING.md](LEARNING.md) for a plain-language walkthrough of how every part works.
