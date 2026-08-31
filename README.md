# Trailhead

Personalized Learning Path Recommender — this repo now implements five
of the six product features:

- **Conversational Interface** — `src/components/ChatPanel.tsx` + `src/app/api/chat/route.ts`
- **Student Dashboard** — `src/components/Dashboard.tsx`, `TrailMap.tsx`, `PathDetailsList.tsx`, `SkillRadarChart.tsx`, `ActivityChart.tsx`
- **Learning Path Generator** — `src/lib/curriculum.ts`, `src/lib/pathGenerator.ts`, `src/app/api/generate-path/route.ts`
- **Profile Engine** — `src/lib/profileEngine.ts` + `src/app/api/profile/route.ts` — Manages student profiles, XP tracking, streaks, and activity logging
- **Recommendation Engine** — `src/lib/recommendationEngine.ts` + `src/app/api/recommendations/route.ts` — Provides skill-based recommendations and analyzes skill gaps

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
tables, then `supabase/002_add_reason_to_waypoints.sql` for the
Path Generator's `reason` column. If Supabase env vars aren't set yet, the
app falls back to mock data in `src/lib/mockData.ts` so the Chat + Dashboard
stay demoable independent of backend progress.

## How this fits the six-feature build

| Feature | Owner | This repo's role |
|---|---|---|
| Conversational Interface | **You** | `ChatPanel.tsx` + `/api/chat` |
| Student Dashboard | **You** | `Dashboard.tsx` + chart/trail components |
| Learning Path Generator | **You** | `pathGenerator.ts`, `curriculum.ts` + `/api/generate-path` |
| Profile Engine | **✓ Implemented** | `profileEngine.ts` + `/api/profile` — Manages profiles, XP, streaks, activity |
| Recommendation Engine | **✓ Implemented** | `recommendationEngine.ts` + `/api/recommendations` — Skill scores & suggestions |
| AI Assistant (broader) | In Progress | May extend the same `/api/chat` route or add new ones |

## Profile Engine

The Profile Engine (`src/lib/profileEngine.ts` + `src/app/api/profile/route.ts`) manages:

- **Profile Management** — Create, read, update student profiles with goals, interests, and learning preferences
- **XP & Leveling** — Track experience points, auto-level up when thresholds are reached
- **Streak Tracking** — Maintain consecutive days of activity, reset on missed days
- **Activity Logging** — Log study minutes per day with automatic streak updates
- **Profile Deltas** — Apply incremental changes from chat or system updates

### Profile API

- `GET /api/profile` — Get current user's profile (auto-create if doesn't exist)
- `POST /api/profile` — Create profile with initial data
- `PATCH /api/profile` — Update profile or apply delta (incremental changes)
- `PUT /api/profile?action=xp` — Add XP and handle level ups
- `PUT /api/profile?action=streak` — Update activity streak
- `PUT /api/profile?action=activity` — Log activity for a day
- `GET /api/profile/activity` — Get recent activity logs (last 30 days)

## Recommendation Engine

The Recommendation Engine (`src/lib/recommendationEngine.ts` + `src/app/api/recommendations/route.ts`) provides:

- **Skill Scoring** — Track 0-100 skill proficiency across multiple domains
- **Skill Gap Analysis** — Identify weak areas based on learning goal and catalog
- **Personalized Recommendations** — Suggest courses based on profile + skills + interests
- **Next Step Guidance** — Recommend natural progression after course completion
- **Skill Overview** — Display top skills and average proficiency level

### Recommendation API

- `GET /api/recommendations` — Get personalized course recommendations (default)
- `GET /api/recommendations?type=gaps` — Analyze skill gaps
- `GET /api/recommendations?type=overview` — Get skill overview (top skills + average)
- `GET /api/recommendations?type=nextSteps&moduleId=X` — Get next step after module
- `GET /api/recommendations?type=skills` — Get all skill scores
- `POST /api/recommendations` — Update skill scores (action: `updateSkill`, `batchUpdateSkills`)

### Integration

Use the `useProfileAndRecommendations` hook in React components to access both engines:

```typescript
const {
  profile,
  skills,
  recommendations,
  skillOverview,
  updateProfile,
  addXP,
  updateSkill,
  refresh,
} = useProfileAndRecommendations();
```

Display recommendations with the `RecommendationsPanel` component:

```typescript
<RecommendationsPanel
  recommendations={recommendations}
  skillOverview={skillOverview}
  onSelectRecommendation={handleSelect}
/>
```

### How the Learning Path Generator works

`POST /api/generate-path` (triggered by the "Generate path" / "Regenerate"
button on the Dashboard):

1. Reads the student's `profiles` row and `skill_scores`.
2. `detectTrack()` maps their stated goal to one of `frontend` / `backend`
   / `data` / `general` by keyword match.
3. `generatePath()` — a **pure, deterministic function, no AI involved** —
   filters the curated `CATALOG` (see `curriculum.ts`) to that track,
   topologically sorts it by prerequisites, and marks each module `done`
   (skill score already ≥ 70), `active` (the next thing to do), `upcoming`,
   or `locked`, with weeks-per-module scaled by their stated weekly hours.
4. Only *after* the structure is locked in, OpenAI is asked to rewrite each
   module's one-line "reason" text to match the student's interests/style —
   it's explicitly told it cannot rename, reorder, add, or remove modules.
   If that call fails, the deterministic reason text is used as-is, so the
   feature never hard-depends on the AI call succeeding.
5. Waypoints are written to `path_waypoints` (replacing the old set), which
   is exactly what the Dashboard's `TrailMap` already reads from.

Keeping the model constrained to a closed catalog (rather than freely
generating course names) is a deliberate choice — it means the path can
never suggest a module that doesn't actually exist in the curriculum.

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
