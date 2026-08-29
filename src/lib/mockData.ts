import { Profile, Waypoint, SkillScore, ActivityDay } from "./types";

// Fallback data shown when Supabase isn't configured yet or a user has no
// rows. Keeps the Chat + Dashboard demoable independent of the
// Profile Engine / Recommendation Engine build status.

export const MOCK_PROFILE: Profile = {
  name: "Aditi Rao",
  goal: "Become a frontend developer",
  level: "Intermediate",
  weeklyHours: 5,
  style: "Visual, hands-on projects",
  interests: ["JavaScript", "UI design", "Accessibility"],
  streakDays: 12,
  xp: 2140,
  xpToNext: 3000,
};

export const MOCK_PATH: Waypoint[] = [
  { id: "1", title: "JS fundamentals refresh", status: "done", weeks: 1 },
  { id: "2", title: "Modern React patterns", status: "active", weeks: 2 },
  { id: "3", title: "State management deep dive", status: "upcoming", weeks: 2 },
  { id: "4", title: "Accessibility foundations", status: "upcoming", weeks: 1 },
  { id: "5", title: "Capstone project", status: "locked", weeks: 3 },
];

export const MOCK_SKILLS: SkillScore[] = [
  { skill: "HTML/CSS", value: 82 },
  { skill: "JavaScript", value: 64 },
  { skill: "React", value: 45 },
  { skill: "Accessibility", value: 38 },
  { skill: "Testing", value: 25 },
  { skill: "Design systems", value: 55 },
];

export const MOCK_ACTIVITY: ActivityDay[] = [
  { day: "Mon", minutes: 45 },
  { day: "Tue", minutes: 30 },
  { day: "Wed", minutes: 60 },
  { day: "Thu", minutes: 0 },
  { day: "Fri", minutes: 75 },
  { day: "Sat", minutes: 20 },
  { day: "Sun", minutes: 50 },
];
