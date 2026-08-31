import { Profile, SkillScore, Suggestion } from "./types";
import { supabaseClient } from "./supabaseClient";
import { CATALOG, CatalogModule } from "./curriculum";

/**
 * Recommendation Engine - Provides skill-based recommendations and manages skill scores:
 * - Tracks skill proficiency across 0-100 scale
 * - Analyzes skill gaps based on learning path
 * - Generates course/module recommendations
 * - Suggests next steps based on profile and progress
 * - Updates skill scores as students complete courses
 */

// Skill categories and their relationships
const SKILL_CATEGORIES = {
  frontend: ["HTML/CSS", "JavaScript", "React", "Accessibility", "Testing", "Design systems"],
  backend: ["Programming", "APIs", "Databases", "Security"],
  data: ["Python", "Statistics", "Visualization", "Machine Learning"],
  general: ["Communication", "Problem Solving"],
};

/**
 * Gets all skill scores for a student
 */
export async function getSkillScores(userId: string): Promise<SkillScore[]> {
  try {
    const { data, error } = await supabaseClient
      .from("skill_scores")
      .select("skill, value")
      .eq("user_id", userId)
      .order("skill", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching skill scores:", error);
    return [];
  }
}

/**
 * Gets a specific skill score, or creates it if it doesn't exist
 */
export async function getOrCreateSkillScore(
  userId: string,
  skill: string
): Promise<SkillScore> {
  try {
    const { data: existing } = await supabaseClient
      .from("skill_scores")
      .select("skill, value")
      .eq("user_id", userId)
      .eq("skill", skill)
      .single();

    if (existing) {
      return existing;
    }

    // Create new skill score starting at 0
    const { data: created, error } = await supabaseClient
      .from("skill_scores")
      .insert([
        {
          user_id: userId,
          skill: skill,
          value: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return created;
  } catch (error) {
    console.error("Error getting/creating skill score:", error);
    return { skill, value: 0 };
  }
}

/**
 * Updates a skill score for a student
 * Validates that value is between 0-100
 */
export async function updateSkillScore(
  userId: string,
  skill: string,
  value: number
): Promise<SkillScore> {
  try {
    // Clamp value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value));

    const { data, error } = await supabaseClient
      .from("skill_scores")
      .upsert(
        [
          {
            user_id: userId,
            skill: skill,
            value: clampedValue,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id,skill" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating skill score:", error);
    throw error;
  }
}

/**
 * Increments a skill score (for course completion, etc.)
 */
export async function incrementSkillScore(
  userId: string,
  skill: string,
  increment: number
): Promise<SkillScore> {
  try {
    const current = await getOrCreateSkillScore(userId, skill);
    const newValue = current.value + increment;
    return updateSkillScore(userId, skill, newValue);
  } catch (error) {
    console.error("Error incrementing skill score:", error);
    throw error;
  }
}

/**
 * Analyzes skill gaps based on student's goal and current skills
 * Returns modules that would help improve weak areas
 */
export async function analyzeSkillGaps(
  userId: string,
  profile: Profile
): Promise<{gaps: Array<{skill: string; gap: number}>; recommendations: Suggestion[]}> {
  try {
    const skillScores = await getSkillScores(userId);
    const skillMap = new Map(skillScores.map((s) => [s.skill, s.value]));

    // Determine relevant track based on goal
    const trackName = profile.goal.toLowerCase();
    const isRelevantTrack = (track: string) => {
      return (
        track === "general" ||
        trackName.includes(track) ||
        (track === "frontend" &&
          (trackName.includes("react") ||
            trackName.includes("ui") ||
            trackName.includes("web"))) ||
        (track === "backend" &&
          (trackName.includes("api") ||
            trackName.includes("server") ||
            trackName.includes("database"))) ||
        (track === "data" &&
          (trackName.includes("python") ||
            trackName.includes("ml") ||
            trackName.includes("analytics")))
      );
    };

    // Get relevant modules
    const relevantModules = CATALOG.filter((m) =>
      isRelevantTrack(m.track)
    );

    // Identify skill gaps
    const gaps: Array<{skill: string; gap: number}> = [];
    const seenSkills = new Set<string>();

    relevantModules.forEach((module) => {
      module.skillTags.forEach((skill) => {
        if (!seenSkills.has(skill)) {
          seenSkills.add(skill);
          const currentLevel = skillMap.get(skill) || 0;
          const targetLevel = 70; // Reasonable proficiency
          const gap = Math.max(0, targetLevel - currentLevel);
          if (gap > 0) {
            gaps.push({ skill, gap });
          }
        }
      });
    });

    // Sort gaps by size (largest first)
    gaps.sort((a, b) => b.gap - a.gap);

    // Generate recommendations from modules that address top gaps
    const topGaps = gaps.slice(0, 3);
    const recommendations: Suggestion[] = [];
    const recommendedModuleIds = new Set<string>();

    topGaps.forEach((gap) => {
      const modulesForSkill = relevantModules.filter(
        (m) =>
          m.skillTags.includes(gap.skill) &&
          !recommendedModuleIds.has(m.id)
      );

      // Pick the most appropriate module (lower difficulty first)
      const bestModule = modulesForSkill.sort((a, b) => a.difficulty - b.difficulty)[0];

      if (bestModule) {
        recommendedModuleIds.add(bestModule.id);
        recommendations.push({
          id: bestModule.id,
          title: bestModule.title,
          reason: `Build your ${gap.skill} skills (gap: ${gap.gap}% from target)`,
        });
      }
    });

    return { gaps, recommendations };
  } catch (error) {
    console.error("Error analyzing skill gaps:", error);
    return { gaps: [], recommendations: [] };
  }
}

/**
 * Generates personalized course recommendations based on:
 * - Student profile (goal, interests, level)
 * - Current skill levels
 * - Available modules in catalog
 */
export async function generateRecommendations(
  userId: string,
  profile: Profile,
  limit: number = 5
): Promise<Suggestion[]> {
  try {
    const skillScores = await getSkillScores(userId);
    const skillMap = new Map(skillScores.map((s) => [s.skill, s.value]));

    // Determine relevant track
    const relevantModules = CATALOG.filter((m) => {
      if (m.track === "general") return true;
      return m.track === determineTrack(profile.goal);
    });

    // Score each module based on:
    // 1. Interest alignment (from interests in profile)
    // 2. Prerequisite readiness (current skills)
    // 3. Difficulty progression (if level is set)
    const scoredModules = relevantModules
      .map((module) => {
        let score = 0;

        // Bonus for matching interests
        const interestBonus = profile.interests.filter((interest) =>
          module.title.toLowerCase().includes(interest.toLowerCase())
        ).length * 20;
        score += interestBonus;

        // Score based on prerequisite skills
        if (module.skillTags.length > 0) {
          const avgSkillLevel =
            module.skillTags.reduce(
              (sum, skill) => sum + (skillMap.get(skill) || 0),
              0
            ) / module.skillTags.length;
          score += avgSkillLevel * 0.5; // Skills matter, but interests matter more
        }

        // Difficulty progression
        const levelMap: Record<string, number> = {
          Beginner: 1,
          Intermediate: 2.5,
          Advanced: 4,
        };
        const targetDifficulty = levelMap[profile.level] || 1;
        const difficultyMatch = 20 - Math.abs(module.difficulty - targetDifficulty) * 5;
        score += Math.max(0, difficultyMatch);

        return {
          module,
          score,
        };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredModules.map((item) => ({
      id: item.module.id,
      title: item.module.title,
      reason: `Matches your goal in ${item.module.track} (${item.module.estimatedWeeks}-week course)`,
    }));
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}

/**
 * Get recommendations on what to learn next based on completion
 * This is more contextual - given a just-completed module, what's the natural next step?
 */
export async function getNextStepRecommendations(
  userId: string,
  completedModuleId: string,
  profile: Profile
): Promise<Suggestion[]> {
  try {
    // Find the completed module
    const completedModule = CATALOG.find((m) => m.id === completedModuleId);
    if (!completedModule) return [];

    // Find modules that depend on this one (directly or indirectly)
    const potentialNext = CATALOG.filter(
      (m) =>
        m.prerequisites.includes(completedModuleId) &&
        m.track === completedModule.track
    ).sort((a, b) => a.difficulty - b.difficulty);

    // Also consider related skills
    const recommendations: Suggestion[] = [];
    const skillScores = await getSkillScores(userId);

    for (const module of potentialNext.slice(0, 3)) {
      const skillLevel = skillScores.find((s) =>
        module.skillTags.includes(s.skill)
      )?.value || 0;

      if (skillLevel < 80) {
        // Not yet expert
        recommendations.push({
          id: module.id,
          title: module.title,
          reason: `Next step: ${module.title} builds on what you just learned`,
        });
      }
    }

    return recommendations.length > 0 ? recommendations : 
      await generateRecommendations(userId, profile, 3);
  } catch (error) {
    console.error("Error getting next step recommendations:", error);
    return [];
  }
}

/**
 * Helper: Determine the best track for a student based on goal
 */
function determineTrack(goal: string): string {
  const g = goal.toLowerCase();
  if (/(front[- ]?end|react|ui\b|web design|javascript)/.test(g)) return "frontend";
  if (/(back[- ]?end|\bapi\b|server|node|database)/.test(g)) return "backend";
  if (/(data|machine learning|\bml\b|analytics|python)/.test(g)) return "data";
  return "general";
}

/**
 * Bulk update multiple skill scores (e.g., when AI analysis determines skill changes)
 */
export async function batchUpdateSkillScores(
  userId: string,
  updates: Array<{skill: string; value: number}>
): Promise<SkillScore[]> {
  try {
    const results: SkillScore[] = [];
    for (const update of updates) {
      const result = await updateSkillScore(userId, update.skill, update.value);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error("Error batch updating skill scores:", error);
    throw error;
  }
}

/**
 * Get skill overview (summary statistics for dashboard display)
 */
export async function getSkillOverview(userId: string): Promise<{
  topSkills: Array<{skill: string; value: number}>;
  averageLevel: number;
  skillCount: number;
}> {
  try {
    const skills = await getSkillScores(userId);
    
    const topSkills = skills
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    const averageLevel =
      skills.length > 0
        ? skills.reduce((sum, s) => sum + s.value, 0) / skills.length
        : 0;

    return {
      topSkills,
      averageLevel: Math.round(averageLevel),
      skillCount: skills.length,
    };
  } catch (error) {
    console.error("Error getting skill overview:", error);
    return { topSkills: [], averageLevel: 0, skillCount: 0 };
  }
}
