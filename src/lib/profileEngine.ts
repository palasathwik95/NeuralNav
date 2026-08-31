import { Profile, ProfileDelta } from "./types";
import { supabase } from "./supabaseClient";

/**
 * Profile Engine - Manages student profiles, including:
 * - Profile creation and initialization
 * - Profile updates (goal, level, weekly hours, style, interests)
 * - XP and streak tracking
 * - Profile retrieval from database
 * - Profile delta application (incremental updates from chat/system)
 */

/**
 * Creates a new student profile or returns existing profile
 * Called on first visit, or when user explicitly creates a new profile
 */
export async function getOrCreateProfile(
  userId: string,
  initialData?: Partial<Profile>
): Promise<Profile> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!fetchError && existing) {
      return mapRowToProfile(existing);
    }

    // Create new profile with defaults
    const newProfile = {
      user_id: userId,
      name: initialData?.name || "Student",
      goal: initialData?.goal || "Set a learning goal",
      level: initialData?.level || "Beginner",
      weekly_hours: initialData?.weeklyHours || 5,
      style: initialData?.style || "",
      interests: initialData?.interests || [],
      streak_days: 0,
      xp: 0,
      xp_to_next: 1000,
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select()
      .single();

    if (error) throw error;
    return mapRowToProfile(data);
  } catch (error) {
    console.error("Error getting/creating profile:", error);
    // Return mock profile as fallback
    return getDefaultProfile();
  }
}

/**
 * Fetches the student's current profile
 */
export async function getProfile(userId: string): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Profile doesn't exist, create it
        return getOrCreateProfile(userId);
      }
      throw error;
    }

    return mapRowToProfile(data);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return getDefaultProfile();
  }
}

/**
 * Updates the student's profile with new data
 * Used for major changes (goal, level, interests, etc.)
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  try {
    const dbUpdates = {
      name: updates.name,
      goal: updates.goal,
      level: updates.level,
      weekly_hours: updates.weeklyHours,
      style: updates.style,
      interests: updates.interests,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(
      (key) => dbUpdates[key as keyof typeof dbUpdates] === undefined && delete dbUpdates[key as keyof typeof dbUpdates]
    );

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return mapRowToProfile(data);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Applies a delta to the profile (incremental changes from chat/system)
 * For small updates like updated interests or weekly hours
 */
export async function applyProfileDelta(
  userId: string,
  delta: ProfileDelta
): Promise<Profile> {
  try {
    // First get current profile
    const current = await getProfile(userId);

    // Merge changes
    const updated = {
      name: current.name,
      goal: delta.goal !== undefined ? delta.goal : current.goal,
      level: delta.level !== undefined ? delta.level : current.level,
      weeklyHours:
        delta.weeklyHours !== undefined ? delta.weeklyHours : current.weeklyHours,
      style: delta.style !== undefined ? delta.style : current.style,
      interests:
        delta.interests !== undefined ? delta.interests : current.interests,
      streakDays: current.streakDays,
      xp: current.xp,
      xpToNext: current.xpToNext,
    };

    return updateProfile(userId, updated);
  } catch (error) {
    console.error("Error applying profile delta:", error);
    throw error;
  }
}

/**
 * Adds XP to the profile and handles level ups
 * Called after completing activities/waypoints
 */
export async function addXP(
  userId: string,
  amount: number
): Promise<{ newXP: number; leveledUp: boolean; newLevel?: string }> {
  try {
    const profile = await getProfile(userId);
    const newXP = profile.xp + amount;
    const xpPerLevel = profile.xpToNext;

    let leveledUp = false;
    let finalXP = newXP;
    let finalXPToNext = xpPerLevel;

    if (newXP >= xpPerLevel) {
      leveledUp = true;
      // Calculate new level based on XP
      const newXPToNext = Math.floor(xpPerLevel * 1.15); // 15% increase per level
      finalXP = newXP - xpPerLevel;
      finalXPToNext = newXPToNext;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        xp: finalXP,
        xp_to_next: finalXPToNext,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    return {
      newXP: finalXP,
      leveledUp,
      newLevel: leveledUp ? "Leveled up!" : undefined,
    };
  } catch (error) {
    console.error("Error adding XP:", error);
    throw error;
  }
}

/**
 * Updates the student's streak (consecutive days of activity)
 * Called after confirming activity for a day
 */
export async function updateStreak(userId: string): Promise<number> {
  try {
    const profile = await getProfile(userId);

    // Check if activity already logged today
    const today = new Date().toISOString().split("T")[0];
    const { data: activityData } = await supabase
      .from("activity_logs")
      .select("minutes")
      .eq("user_id", userId)
      .eq("day", today)
      .single();

    if (activityData && activityData.minutes > 0) {
      // Already logged activity today
      return profile.streakDays;
    }

    // Increment streak
    const newStreak = profile.streakDays + 1;
    const { error } = await supabase
      .from("profiles")
      .update({
        streak_days: newStreak,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;
    return newStreak;
  } catch (error) {
    console.error("Error updating streak:", error);
    throw error;
  }
}

/**
 * Resets the streak (called when a day is missed)
 */
export async function resetStreak(userId: string): Promise<void> {
  try {
    await supabase
      .from("profiles")
      .update({
        streak_days: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } catch (error) {
    console.error("Error resetting streak:", error);
    throw error;
  }
}

/**
 * Logs activity for a given day (in minutes)
 */
export async function logActivity(
  userId: string,
  minutes: number,
  day?: string
): Promise<void> {
  try {
    const activityDay = day || new Date().toISOString().split("T")[0];

    const { error: upsertError } = await supabase
      .from("activity_logs")
      .upsert(
        [
          {
            user_id: userId,
            day: activityDay,
            minutes,
          },
        ],
        { onConflict: "user_id,day" }
      );

    if (upsertError) throw upsertError;

    // Update streak if activity logged today
    if (!day) {
      await updateStreak(userId);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
}

/**
 * Gets recent activity logs (last 30 days)
 */
export async function getRecentActivity(userId: string): Promise<Array<{day: string; minutes: number}>> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("activity_logs")
      .select("day, minutes")
      .eq("user_id", userId)
      .gte("day", thirtyDaysAgo.toISOString().split("T")[0])
      .order("day", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching activity:", error);
    return [];
  }
}

/**
 * Helper function to map database row to Profile interface
 */
function mapRowToProfile(row: any): Profile {
  return {
    name: row.name,
    goal: row.goal,
    level: row.level,
    weeklyHours: row.weekly_hours,
    style: row.style,
    interests: row.interests || [],
    streakDays: row.streak_days,
    xp: row.xp,
    xpToNext: row.xp_to_next,
  };
}

/**
 * Returns a default/mock profile when database is not available
 */
function getDefaultProfile(): Profile {
  return {
    name: "Student",
    goal: "Set a learning goal",
    level: "Beginner",
    weeklyHours: 5,
    style: "",
    interests: [],
    streakDays: 0,
    xp: 0,
    xpToNext: 1000,
  };
}

/**
 * Batch fetch profiles (used internally for analytics/admin)
 */
export async function getProfilesBatch(userIds: string[]): Promise<Map<string, Profile>> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (error) throw error;

    const profileMap = new Map<string, Profile>();
    (data || []).forEach((row: any) => {
      profileMap.set(row.user_id, mapRowToProfile(row));
    });

    return profileMap;
  } catch (error) {
    console.error("Error fetching profiles batch:", error);
    return new Map();
  }
}
