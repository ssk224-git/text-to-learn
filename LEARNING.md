# LEARNING.md: how Text-to-Learn works, in plain language

This project was built quickly with AI help. This guide is for **you** to come back to while doing the MERN and GenAI courses, so you can understand every piece and explain it in an interview. Read it next to the code.

## 1. The big picture

```
You type a topic ─▶ React app ─▶ Express API ─▶ Gemini (AI)
                                     │
                                     ▼
                                 MongoDB (saves everything)
```

- **React (client/)** is what you see in the browser. It never talks to the AI directly.
- **Express (server/)** is a program running on a server. It receives requests like "generate a course about X", asks Gemini, checks the answer, saves it in MongoDB and sends it back.
- **MongoDB** is the database: it stores courses, modules and lessons as JSON-like documents.

**Why not call Gemini straight from React?** Then your API key would be inside the website's code, and anyone could copy it and use your quota. Keys must stay on the server.

## 2. Follow one request from start to finish

**"Generate a course about React Hooks":**

1. `client/src/components/PromptForm.jsx`: you click *Generate*. It calls `api('/api/courses/generate', { method: 'POST', body: { topic } })`.
2. `client/src/hooks/useApi.js` adds the login token, and `client/src/utils/api.js` runs `fetch()`.
3. `server/server.js` receives it and passes it to `routes/courseRoutes.js`, which runs these **middlewares in order**:
   - `requireAuth`: who are you? (In dev mode, everyone is `dev-user`.)
   - `courseGenerationLimiter`: have you made too many requests?
   - `validateTopic`: is this a real topic, not a prompt-injection attempt?
4. `controllers/courseController.js` → `generateCourse()` calls the AI pipeline.
5. `services/courseGenerator.js`:
   - builds the prompt (`services/prompts.js`)
   - calls Gemini (`services/ai/geminiProvider.js`)
   - extracts the JSON (`utils/parseJson.js`)
   - checks it (`utils/validators.js`)
   - if there are problems, asks again **once**, telling the model exactly what was wrong
6. The controller saves 1 Course, N Modules and the Lesson *titles* to MongoDB (`models/`).
7. The React app receives the course and navigates to `/courses/:id`.

**Opening a lesson:** `GET /api/courses/:id/modules/0/lessons/0` → `lessonController.getLesson()`. If the lesson isn't generated yet (`isEnriched: false`), it's generated now, saved, and returned. The next visit just reads it from MongoDB.

> C++ comparison: middleware is like a chain of functions where each one either calls `next()` (pass it on) or stops and returns an error, a bit like a pipeline of filters.

## 3. Key ideas to understand (and talk about in interviews)

| Idea | Where | One-line explanation |
|---|---|---|
| REST API | `server/routes/` | URLs + HTTP methods (GET read, POST create, DELETE remove) |
| Middleware | `server/middlewares/` | Functions that run before your route: auth, validation, rate limits |
| Mongoose schema | `server/models/` | Defines the shape of documents, like a `struct` for the database |
| References / populate | `courseController.findOwnedCourse` | Course stores module **ids**; `.populate()` swaps ids for the real documents |
| JWT auth | `middlewares/auth.js` | Auth0 signs a token; the server checks the signature, so it knows who you are without a password |
| Prompt engineering | `services/prompts.js` | Exact instructions plus a JSON shape, so the AI's output can be used by code |
| Output validation | `utils/validators.js` | Never trust AI output: clean it, check it, retry with feedback |
| Model fallback | `geminiProvider.generateText` | If one model is overloaded, try the next |
| Guardrails | `utils/guardrails.js` | Block "ignore previous instructions…" before it reaches the AI |
| Lazy generation | `lessonController.ensureLessonContent` | Generate lessons only when opened: cheaper and faster |
| De-duplication | `inFlight` Map in `lessonController.js` | Two requests for the same lesson share one AI call |
| React components | `client/src/components/` | Reusable UI pieces, like functions that return HTML |
| State + effects | `useState`, `useEffect`, `hooks/useAsync.js` | State = data that changes the UI; effects = run code when something changes (e.g. fetch data) |
| Context | `context/AuthContext.jsx` | Share data (who is logged in) with every component without passing props down |
| Routing | `client/src/main.jsx` | Which page shows for which URL |
| Rendering JSON as UI | `LessonRenderer.jsx` | Look at each block's `type` and pick the matching component |

## 4. File map

### Backend (`server/`)
- `server.js`: creates the Express app, adds security headers (helmet), CORS and JSON parsing, mounts the routes, connects to MongoDB, starts listening.
- `config/env.js`: reads `.env` in one place. `config/db.js`: connects to MongoDB.
- `models/*.js`: the four schemas. Read `Lesson.js` first; its comments explain `isEnriched`.
- `routes/*.js`: which URL goes to which controller, and which middlewares run first.
- `controllers/*.js`: the actual work for each route.
- `services/prompts.js`: all AI prompts. **Good place to experiment.**
- `services/courseGenerator.js`: the generate → parse → validate → retry loop.
- `services/ai/geminiProvider.js`: the only file that knows about Gemini. To add OpenAI or Groq, write a file like this and register it in `services/ai/index.js`.
- `services/youtubeService.js`: YouTube search with a 24h cache.
- `utils/`: small pure functions (easy to unit test). `tests/validation.test.js` tests them.

### Frontend (`client/src/`)
- `main.jsx`: routes. `App.jsx`: layout (sidebar + top bar + page).
- `pages/`: one file per screen.
- `components/LessonRenderer.jsx` + `components/blocks/`: JSON blocks → UI.
- `components/LessonPDFExporter.jsx`: hidden white copy → html2canvas "screenshot" → jsPDF pages.
- `components/HinglishAudio.jsx`: gets the Hinglish script, tries AI audio, falls back to the browser's `speechSynthesis`.
- `context/AuthContext.jsx`: Auth0 login, or dev mode when Auth0 isn't configured.

## 5. Problems we hit while building (good interview stories)

1. **MongoDB "Invalid connection string":** the password contained `@`, which is the separator in a URL. Fix: URL-encode it (`%40`) or use letters and numbers only.
2. **The AI model was retired:** `gemini-2.5-flash` returned 404 for new users. Fix: a configurable model list with automatic fallback.
3. **Google's servers were overloaded:** one model took 165 s to say "OK". Fix: timeouts + fallback to the next model. It worked live: 3.6 Flash timed out and 3.5 Flash finished the lesson.
4. **Too many "thinking" tokens:** setting `thinkingLevel: low` cut tokens by about 56% with no visible quality loss.
5. **No AI voice on the free tier:** the TTS model returned 429. Fix: fall back to the browser's built-in Hindi voice, and stop retrying the AI voice for 30 minutes.
6. **PDF stuck in background tabs:** `requestAnimationFrame` doesn't fire in hidden tabs. Fix: wait with `setTimeout` instead.
7. **React dev mode calls effects twice:** that would have generated each lesson twice. Fix: the server shares one in-flight AI call per lesson.

## 6. Interview questions to practise

- Why generate lessons lazily instead of all at once? *(Cost, speed, and most people don't open every lesson.)*
- What happens if the AI returns broken JSON? *(Extract, validate, retry once with the exact problems listed, then fail with a clear message.)*
- How do you stop users from seeing each other's courses? *(Every query filters by `creator: req.user.sub`; others get 404, not 403, so we don't reveal what exists.)*
- How do you protect against prompt injection? *(Input patterns are blocked, the topic is wrapped in tags and treated as data, and output is validated.)*
- Why is the YouTube key on the server, not in React? *(Anything in frontend code is public.)*
- What would you change to support 10,000 users? *(A queue for AI jobs, Redis caching, streaming responses, background pre-generation of lesson 1.)*

## 7. Ideas to make it yours (when you've learned more)

- Stream lesson text as it's generated (Server-Sent Events) so users see progress.
- An evaluation set: 20 topics, scored by an LLM-as-judge for accuracy and structure (GenAI course, Module 12).
- Progress tracking: mark lessons complete and save quiz scores.
- Export a whole course as one PDF.
