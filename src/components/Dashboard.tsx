"use client";

import { Flame, Clock, Sparkles, Check, X, RefreshCw } from "lucide-react";
import TrailMap from "./TrailMap";
import PathDetailsList from "./PathDetailsList";
import SkillRadarChart from "./SkillRadarChart";
import ActivityChart from "./ActivityChart";
import StatPill from "./StatPill";
import { supabase, DEMO_USER_ID, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Profile, Waypoint, SkillScore, ActivityDay, Suggestion } from "@/lib/types";
import { Dispatch, SetStateAction, useState } from "react";

interface DashboardProps {
  profile: Profile;
  path: Waypoint[];
  setPath: Dispatch<SetStateAction<Waypoint[]>>;
  skills: SkillScore[];
  activity: ActivityDay[];
  suggestions: Suggestion[];
  setSuggestions: Dispatch<SetStateAction<Suggestion[]>>;
}

export default function Dashboard({ profile, path, setPath, skills, activity, suggestions, setSuggestions }: DashboardProps) {
  const [generating, setGenerating] = useState(false);

  const generatePath = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-path", { method: "POST" });
      const data = await res.json();
      if (data.waypoints) {
        setPath(
          data.waypoints.map((w: { moduleId: string; title: string; status: Waypoint["status"]; weeks: number; reason: string }) => ({
            id: w.moduleId,
            title: w.title,
            status: w.status,
            weeks: w.weeks,
            reason: w.reason,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to generate path", err);
    } finally {
      setGenerating(false);
    }
  };

  const acceptSuggestion = async (s: Suggestion) => {
    const newWaypoint: Waypoint = { id: `local-${Date.now()}`, title: s.title, status: "upcoming", weeks: 1 };
    setPath((p) => [...p, newWaypoint]);
    setSuggestions((sg) => sg.filter((x) => x.id !== s.id));
    if (isSupabaseConfigured) {
      await supabase.from("path_waypoints").insert({
        user_id: DEMO_USER_ID,
        title: s.title,
        status: "upcoming",
        weeks: 1,
        order_index: path.length,
      });
      await supabase.from("mentor_suggestions").update({ status: "accepted" }).eq("id", s.id);
    }
  };

  const dismissSuggestion = async (s: Suggestion) => {
    setSuggestions((sg) => sg.filter((x) => x.id !== s.id));
    if (isSupabaseConfigured) {
      await supabase.from("mentor_suggestions").update({ status: "dismissed" }).eq("id", s.id);
    }
  };

  const totalMinutes = activity.reduce((a, d) => a + d.minutes, 0);
  const xpPct = Math.min(100, Math.round((profile.xp / profile.xpToNext) * 100));

  return (
    <div className="flex flex-col gap-6 pb-2">
      {/* Profile summary */}
      <div className="rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 bg-trail-surface border border-trail-border">
        <div className="flex-1 min-w-0">
          <div className="font-sans text-xs text-trail-muted">Learning goal</div>
          <div className="font-display font-semibold text-xl text-trail-text">{profile.goal}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.interests.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-0.5 font-sans text-[11.5px] text-trail-teal border border-trail-tealDark"
                style={{ background: "rgba(79,182,160,0.12)" }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 max-w-[280px]">
            <div className="flex justify-between mb-1 font-sans text-[11px] text-trail-muted">
              <span>Level {profile.level}</span>
              <span>
                {profile.xp} / {profile.xpToNext} xp
              </span>
            </div>
            <div className="rounded-full overflow-hidden h-1.5 bg-trail-surface2">
              <div className="h-full bg-trail-amber" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <StatPill icon={<Flame size={18} className="text-trail-amber" />} label="day streak" value={profile.streakDays} />
          <StatPill icon={<Clock size={18} className="text-trail-teal" />} label="hrs / week goal" value={profile.weeklyHours} />
          <StatPill icon={<Sparkles size={18} className="text-trail-teal" />} label="min this week" value={totalMinutes} />
        </div>
      </div>

      {/* Trail map */}
      <div className="rounded-2xl p-5 bg-trail-surface border border-trail-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display font-semibold text-base text-trail-text">Your path</div>
            <div className="font-sans text-[12.5px] text-trail-muted mb-1">
              Generated from your goal and current skills — updated as you and Pathfinder talk.
            </div>
          </div>
          <button
            onClick={generatePath}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 shrink-0 bg-trail-surface2 border border-trail-borderStrong font-sans text-[12.5px] text-trail-text disabled:opacity-60"
          >
            <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
            {path.length === 0 ? "Generate path" : "Regenerate"}
          </button>
        </div>
        {path.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="font-sans text-sm text-trail-muted max-w-xs">
              No path yet — generate one from your current goal and skills to get started.
            </div>
          </div>
        ) : (
          <>
            <TrailMap path={path} />
            <PathDetailsList path={path} />
          </>
        )}
      </div>

      {/* Mentor suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl p-5 bg-trail-surface border border-trail-amberDark">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-trail-amber" />
            <span className="font-display font-semibold text-[15px] text-trail-text">From your mentor</span>
          </div>
          <div className="flex flex-col">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 py-3 border-t border-trail-border">
                <div className="min-w-0">
                  <div className="font-sans font-medium text-sm text-trail-text">{s.title}</div>
                  <div className="font-sans text-[12.5px] text-trail-muted">{s.reason}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => acceptSuggestion(s)}
                    className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-trail-teal"
                    aria-label="Accept suggestion"
                  >
                    <Check size={14} className="text-trail-tealText" />
                  </button>
                  <button
                    onClick={() => dismissSuggestion(s)}
                    className="w-[30px] h-[30px] rounded-lg flex items-center justify-center border border-trail-borderStrong"
                    aria-label="Dismiss suggestion"
                  >
                    <X size={14} className="text-trail-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5 bg-trail-surface border border-trail-border">
          <div className="font-display font-semibold text-[15px] text-trail-text mb-2">Skill map</div>
          <SkillRadarChart skills={skills} />
        </div>
        <div className="rounded-2xl p-5 bg-trail-surface border border-trail-border">
          <div className="font-display font-semibold text-[15px] text-trail-text mb-2">This week&apos;s activity</div>
          <ActivityChart activity={activity} />
        </div>
      </div>
    </div>
  );
}
