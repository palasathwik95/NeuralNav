// Builds the typed AssistantContext from mock data.
// No database required — all student data comes from mockData.ts.
// When your team wires up Supabase later, swap buildMockContext()
// for real DB queries here without touching anything else.

import { MOCK_PROFILE, MOCK_PATH, MOCK_SKILLS } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssistantProfileContext {
  name: string;
  goal: string;
  level: string;
  weeklyHours: number;
  learningStyle: string;
  interests: string[];
  streakDays: number;
  xp: number;
  xpToNext: number;
}

export interface AssistantWaypoint {
  title: string;
  status: "done" | "active" | "upcoming" | "locked";
  weeks: number;
  orderIndex: number;
}

export interface AssistantSkillGap {
  skill: string;
  /** Current proficiency 0–100. Below 50 is treated as a gap. */
  value: number;
}

export interface AssistantSuggestion {
  id: string;
  title: string;
  reason: string;
}

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AssistantContext {
  profile: AssistantProfileContext;
  learningPath: AssistantWaypoint[];
  /** Skills with value < 50 — treated as skill gaps. */
  skillGaps: AssistantSkillGap[];
  /** All skill scores for progress questions. */
  allSkills: AssistantSkillGap[];
  /** Pending recommendations from the recommendation engine. */
  recommendations: AssistantSuggestion[];
  /** Recent conversation history, oldest first. */
  recentHistory: AssistantChatMessage[];
}

// ---------------------------------------------------------------------------
// Builder — mock-only, no Supabase dependency
// ---------------------------------------------------------------------------

/**
 * Returns the student context used to build the AI mentor's system prompt.
 * Currently uses mock data. The recentHistory is injected by the API route
 * from the in-memory session store so conversation memory works within a session.
 */
export function buildAssistantContext(
  recentHistory: AssistantChatMessage[] = [],
): AssistantContext {
  const allSkills: AssistantSkillGap[] = MOCK_SKILLS.map((s) => ({
    skill: s.skill,
    value: s.value,
  }));

  return {
    profile: {
      name: MOCK_PROFILE.name,
      goal: MOCK_PROFILE.goal,
      level: MOCK_PROFILE.level,
      weeklyHours: MOCK_PROFILE.weeklyHours,
      learningStyle: MOCK_PROFILE.style,
      interests: MOCK_PROFILE.interests,
      streakDays: MOCK_PROFILE.streakDays,
      xp: MOCK_PROFILE.xp,
      xpToNext: MOCK_PROFILE.xpToNext,
    },
    learningPath: MOCK_PATH.map((w, i) => ({
      title: w.title,
      status: w.status as AssistantWaypoint["status"],
      weeks: w.weeks,
      orderIndex: i,
    })),
    allSkills,
    skillGaps: allSkills.filter((s) => s.value < 50),
    recommendations: [],
    recentHistory,
  };
}
