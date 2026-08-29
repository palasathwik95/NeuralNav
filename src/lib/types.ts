export interface Profile {
  name: string;
  goal: string;
  level: string;
  weeklyHours: number;
  style: string;
  interests: string[];
  streakDays: number;
  xp: number;
  xpToNext: number;
}

export type WaypointStatus = "done" | "active" | "upcoming" | "locked";

export interface Waypoint {
  id: string;
  title: string;
  status: WaypointStatus;
  weeks: number;
}

export interface SkillScore {
  skill: string;
  value: number;
}

export interface ActivityDay {
  day: string;
  minutes: number;
}

export interface Suggestion {
  id: string;
  title: string;
  reason: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProfileDelta {
  goal?: string;
  level?: string;
  weeklyHours?: number;
  style?: string;
  interests?: string[];
}

export interface PathSuggestionPayload {
  title: string;
  reason: string;
}
