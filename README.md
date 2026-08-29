# Trailhead

Personalized Learning Path Recommender — this repo currently implements two
of the six product features:

- **Conversational Interface** — `src/components/ChatPanel.tsx` + `src/app/api/chat/route.ts`
- **Student Dashboard** — `src/components/Dashboard.tsx`, `TrailMap.tsx`, `SkillRadarChart.tsx`, `ActivityChart.tsx`

Stack: Next.js (App Router) + React + TypeScript + Tailwind CSS + Supabase
(Postgres) + OpenAI API + Recharts, deployable to Vercel.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Env vars needed (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client reads
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by `/api/chat` to write
  chat-derived updates
- `OPENAI_API_KEY`, `OPENAI_MODEL` (defaults to `gpt-4o-mini`)

Run `supabase/schema.sql` against your Supabase project to create the
tables. If Supabase env vars aren't set yet, the app falls back to mock
data in `src/lib/mockData.ts` so the Chat + Dashboard stay demoable
independent of backend progress.

## How this fits the six-feature build

| Feature | Owner | This repo's role |
|---|---|---|
| Conversational Interface | **You (today)** | `ChatPanel.tsx` + `/api/chat` |
| Student Dashboard | **You (today)** | `Dashboard.tsx` + chart/trail components |
| Profile Engine | Teammate | Reads/writes the `profiles` table |
| Recommendation Engine | Teammate | Writes `skill_scores`, feeds suggestion logic |
| Learning Path Generator | Teammate | Writes `path_waypoints` (initial path) |
| AI Assistant (broader) | Teammate | May extend the same `/api/chat` route or add new ones |

### Integration contract

The chat's system prompt asks the OpenAI model to emit two hidden,
machine-only blocks when relevant, which the API route parses server-side
before anything reaches the browser:

```
<<PROFILE_DELTA>>{"weeklyHours":6}<<END>>
<<PATH_SUGGESTION>>{"title":"CSS Grid & Layout Systems","reason":"..."}<<END>>
```

- `PROFILE_DELTA` is applied to the `profiles` row (this is what the
  Profile Engine should treat as its main mutation path from
  conversation).
- `PATH_SUGGESTION` is inserted into `mentor_suggestions` as `pending`;
  accepting it on the Dashboard inserts a new row into `path_waypoints`.
  The Recommendation Engine can also insert directly into
  `mentor_suggestions` to surface its own suggestions in the same UI.

### Known gaps / next steps

- **Auth**: there's no sign-in flow yet, so every table read/write uses a
  placeholder `DEMO_USER_ID` (see `src/lib/supabaseClient.ts`). Swap this
  for `supabase.auth.getUser()` once auth lands.
- **Skill scores / activity logs** are read-only here — the Recommendation
  Engine and a lesson-completion flow should be the ones writing to
  `skill_scores` and `activity_logs`.
- Deploy target is Vercel; no Vercel-specific config is needed beyond
  setting the env vars in the project dashboard.
