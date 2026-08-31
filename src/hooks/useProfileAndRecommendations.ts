"use client";

import { useEffect, useState, useCallback } from "react";
import { Profile, SkillScore, Suggestion } from "@/lib/types";

/**
 * Hook for Profile and Recommendation Engine Integration
 * Manages profile data and recommendations using the new engines
 */
export function useProfileAndRecommendations() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<SkillScore[]>([]);
  const [recommendations, setRecommendations] = useState<Suggestion[]>([]);
  const [skillGaps, setSkillGaps] = useState<any>(null);
  const [skillOverview, setSkillOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  // Load skill scores
  const loadSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations?type=skills");
      if (!res.ok) throw new Error("Failed to load skills");
      const data = await res.json();
      setSkills(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    }
  }, []);

  // Load recommendations
  const loadRecommendations = useCallback(async (limit: number = 5) => {
    try {
      const res = await fetch(`/api/recommendations?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load recommendations");
      const data = await res.json();
      setRecommendations(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    }
  }, []);

  // Load skill gaps
  const loadSkillGaps = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations?type=gaps");
      if (!res.ok) throw new Error("Failed to load skill gaps");
      const data = await res.json();
      setSkillGaps(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  // Load skill overview
  const loadSkillOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/recommendations?type=overview");
      if (!res.ok) throw new Error("Failed to load skill overview");
      const data = await res.json();
      setSkillOverview(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, []);

  // Add XP
  const addXP = useCallback(async (amount: number) => {
    try {
      const res = await fetch("/api/profile?action=xp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed to add XP");
      const data = await res.json();
      if (profile) {
        setProfile({
          ...profile,
          xp: data.newXP,
          xpToNext: profile.xpToNext, // Would need to update this properly
        });
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, [profile]);

  // Update skill score
  const updateSkill = useCallback(async (skill: string, value: number) => {
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSkill", skill, value }),
      });
      if (!res.ok) throw new Error("Failed to update skill");
      const data = await res.json();
      setSkills((prev) => {
        const existing = prev.findIndex((s) => s.skill === skill);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, []);

  // Get next step recommendations
  const getNextSteps = useCallback(async (moduleId: string) => {
    try {
      const res = await fetch(`/api/recommendations?type=nextSteps&moduleId=${moduleId}`);
      if (!res.ok) throw new Error("Failed to load next steps");
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadProfile(),
        loadSkills(),
        loadRecommendations(),
        loadSkillOverview(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [loadProfile, loadSkills, loadRecommendations, loadSkillOverview]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadSkills(),
        loadRecommendations(),
        loadSkillGaps(),
        loadSkillOverview(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, loadSkills, loadRecommendations, loadSkillGaps, loadSkillOverview]);

  return {
    profile,
    skills,
    recommendations,
    skillGaps,
    skillOverview,
    loading,
    error,
    updateProfile,
    addXP,
    updateSkill,
    getNextSteps,
    loadRecommendations,
    loadSkillGaps,
    loadSkillOverview,
    refresh,
  };
}
