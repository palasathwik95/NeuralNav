"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, DEMO_USER_ID } from "@/lib/supabaseClient";
import { MOCK_PROFILE, MOCK_PATH, MOCK_SKILLS, MOCK_ACTIVITY } from "@/lib/mockData";
import { Profile, Waypoint, SkillScore, ActivityDay, Suggestion } from "@/lib/types";

export function useTrailheadData() {
  const [profile, setProfile] = useState<Profile>(MOCK_PROFILE);
  const [path, setPath] = useState<Waypoint[]>(MOCK_PATH);
  const [skills, setSkills] = useState<SkillScore[]>(MOCK_SKILLS);
  const [activity, setActivity] = useState<ActivityDay[]>(MOCK_ACTIVITY);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: p }, { data: wp }, { data: sk }, { data: act }, { data: sug }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", DEMO_USER_ID).maybeSingle(),
        supabase.from("path_waypoints").select("*").eq("user_id", DEMO_USER_ID).order("order_index"),
        supabase.from("skill_scores").select("skill, value").eq("user_id", DEMO_USER_ID),
        supabase.from("activity_logs").select("day, minutes").eq("user_id", DEMO_USER_ID).order("day"),
        supabase.from("mentor_suggestions").select("*").eq("user_id", DEMO_USER_ID).eq("status", "pending"),
      ]);

      if (p) {
        setProfile({
          name: p.name,
          goal: p.goal,
          level: p.level,
          weeklyHours: p.weekly_hours,
          style: p.style,
          interests: p.interests ?? [],
          streakDays: p.streak_days,
          xp: p.xp,
          xpToNext: p.xp_to_next,
        });
      }
      if (wp && wp.length > 0) {
        setPath(wp.map((w) => ({ id: w.id, title: w.title, status: w.status, weeks: w.weeks, reason: w.reason ?? "" })));
      }
      if (sk && sk.length > 0) setSkills(sk);
      if (act && act.length > 0) setActivity(act.map((a) => ({ day: a.day, minutes: a.minutes })));
      if (sug) setSuggestions(sug.map((s) => ({ id: s.id, title: s.title, reason: s.reason })));
    } catch (err) {
      // Table might not exist yet, or the demo user has no rows. Mock
      // data (already the initial state) covers the UI in the meantime.
      console.warn("Trailhead: falling back to mock data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, setProfile, path, setPath, skills, activity, suggestions, setSuggestions, loading, refresh: load };
}
