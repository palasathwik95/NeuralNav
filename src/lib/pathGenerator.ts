import { CATALOG, CatalogModule, Track } from "./curriculum";
import { Profile, SkillScore, WaypointStatus } from "./types";

export interface GeneratedWaypoint {
  moduleId: string;
  title: string;
  status: WaypointStatus;
  weeks: number;
  reason: string;
}

// A skill at or above this value is treated as "already competent" — the
// module is marked done rather than queued up again.
const READY_THRESHOLD = 70;

// How many not-yet-started modules past the active one are shown as
// "upcoming" (visible, planned) before the rest fall behind a "locked" wall.
const UPCOMING_HORIZON = 3;

const BASELINE_HOURS_PER_WEEK = 5;

export function detectTrack(goal: string): Track {
  const g = goal.toLowerCase();
  if (/(front[- ]?end|react|ui\b|web design|javascript)/.test(g)) return "frontend";
  if (/(back[- ]?end|\bapi\b|server|node|database)/.test(g)) return "backend";
  if (/(data|machine learning|\bml\b|analytics|python)/.test(g)) return "data";
  return "general";
}

function skillReadiness(module: CatalogModule, skills: SkillScore[]): number {
  if (module.skillTags.length === 0) return 0;
  const values = module.skillTags.map((tag) => skills.find((s) => s.skill === tag)?.value ?? 0);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Orders modules so every prerequisite comes before the module that needs
// it, breaking ties by difficulty so the path still ramps up sensibly.
function topoSort(modules: CatalogModule[]): CatalogModule[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const visited = new Set<string>();
  const result: CatalogModule[] = [];

  function visit(m: CatalogModule) {
    if (visited.has(m.id)) return;
    visited.add(m.id);
    for (const prereqId of m.prerequisites) {
      const prereq = byId.get(prereqId);
      if (prereq) visit(prereq);
    }
    result.push(m);
  }

  [...modules].sort((a, b) => a.difficulty - b.difficulty).forEach(visit);
  return result;
}

export function generatePath(profile: Profile, skills: SkillScore[]): GeneratedWaypoint[] {
  const track = detectTrack(profile.goal);
  const relevant = CATALOG.filter((m) => m.track === track || m.track === "general");
  const ordered = topoSort(relevant);

  const weeklyHours = profile.weeklyHours > 0 ? profile.weeklyHours : BASELINE_HOURS_PER_WEEK;

  let activeAssigned = false;
  let upcomingCount = 0;

  return ordered.map((module) => {
    const readiness = skillReadiness(module, skills);
    let status: WaypointStatus;

    if (readiness >= READY_THRESHOLD) {
      status = "done";
    } else if (!activeAssigned) {
      status = "active";
      activeAssigned = true;
    } else if (upcomingCount < UPCOMING_HORIZON) {
      status = "upcoming";
      upcomingCount++;
    } else {
      status = "locked";
    }

    const weeks = Math.max(1, Math.round(module.estimatedWeeks * (BASELINE_HOURS_PER_WEEK / weeklyHours)));

    const reason =
      status === "done"
        ? `Your ${module.skillTags[0] ?? "related"} skill score shows you've already got this covered.`
        : status === "active"
        ? `Starting here — it builds directly on what you already know and moves you toward your goal.`
        : `Builds on the modules before it and keeps you on track for your goal: ${profile.goal}.`;

    return { moduleId: module.id, title: module.title, status, weeks, reason };
  });
}
