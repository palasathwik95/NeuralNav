"use client";

import { useState, useRef, useEffect } from "react";
import { Compass, MessageCircle, LayoutGrid, Edit2, Zap } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import Dashboard from "@/components/Dashboard";
import GoalSetup from "@/components/GoalSetup";
import { useTrailheadData } from "@/hooks/useTrailheadData";
import { supabase, DEMO_USER_ID, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ProfileDelta, PathSuggestionPayload } from "@/lib/types";

export default function Page() {
  const [tab, setTab] = useState<"chat" | "dashboard">("chat");
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [showPathRegeneratePrompt, setShowPathRegeneratePrompt] = useState(false);
  const previousGoalRef = useRef<string>("");
  const { profile, setProfile, path, setPath, skills, activity, suggestions, setSuggestions } = useTrailheadData();

  // Track goal changes
  useEffect(() => {
    if (!previousGoalRef.current) {
      previousGoalRef.current = profile.goal;
    } else if (previousGoalRef.current !== profile.goal) {
      // Goal changed - show regenerate prompt
      setShowPathRegeneratePrompt(true);
      previousGoalRef.current = profile.goal;
    }
  }, [profile.goal]);

  const applyProfileDelta = async (delta: ProfileDelta) => {
    setProfile((p) => ({ ...p, ...delta, interests: delta.interests ?? p.interests }));
    // The API route already persists this server-side with the service
    // role key; nothing else to do here on the client.
  };

  const applyPathSuggestion = (s: PathSuggestionPayload) => {
    setSuggestions((sg) => [...sg, { id: `local-${Date.now()}`, title: s.title, reason: s.reason }]);
  };

  const regeneratePath = async () => {
    setGeneratingPath(true);
    try {
      const res = await fetch("/api/generate-path", { method: "POST" });
      const data = await res.json();
      if (data.waypoints) {
        setPath(
          data.waypoints.map((w: any) => ({
            id: w.moduleId,
            title: w.title,
            status: w.status,
            weeks: w.weeks,
            reason: w.reason,
          }))
        );
        setShowPathRegeneratePrompt(false);
      }
    } catch (err) {
      console.error("Failed to regenerate path", err);
    } finally {
      setGeneratingPath(false);
    }
  };

  const handleGoalSet = async (goal: string) => {
    // Update local state
    setProfile((p) => ({ ...p, goal }));
    setShowGoalSetup(false);

    // Persist to database
    if (isSupabaseConfigured) {
      await supabase
        .from("profiles")
        .update({ goal, updated_at: new Date().toISOString() })
        .eq("user_id", DEMO_USER_ID);
    }

    // Auto-regenerate path for new goal
    setTimeout(() => regeneratePath(), 300);
  };

  return (
    <div className="min-h-screen bg-trail-bg">
      <GoalSetup isOpen={showGoalSetup} initialGoal={profile?.goal} onGoalSet={handleGoalSet} />

      <div className="max-w-4xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-trail-surface2 border border-trail-border">
              <Compass size={20} className="text-trail-amber" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-trail-text">Trailhead</div>
              <div className="font-sans text-xs text-trail-muted">Your personalized learning path</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGoalSetup(true)}
              className="p-2 rounded-lg hover:bg-trail-surface2 transition-colors"
              title="Change goal"
            >
              <Edit2 size={16} className="text-trail-muted hover:text-trail-text" />
            </button>

            <div className="flex rounded-xl p-1 bg-trail-surface2 border border-trail-border">
              <button
                onClick={() => setTab("chat")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-sans text-[13.5px] font-medium ${
                  tab === "chat" ? "bg-trail-surface text-trail-text" : "text-trail-muted"
                }`}
              >
                <MessageCircle size={15} /> Mentor chat
              </button>
              <button
                onClick={() => setTab("dashboard")}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 font-sans text-[13.5px] font-medium ${
                  tab === "dashboard" ? "bg-trail-surface text-trail-text" : "text-trail-muted"
                }`}
              >
                <LayoutGrid size={15} /> Dashboard
                {suggestions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-trail-amber text-trail-amberText font-mono text-[10px]">
                    {suggestions.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {tab === "chat" ? (
          <ChatPanel profile={profile} onProfileDelta={applyProfileDelta} onPathSuggestion={applyPathSuggestion} />
        ) : (
          <>
            {showPathRegeneratePrompt && (
              <div className="mb-4 p-4 rounded-2xl bg-trail-amber/10 border border-trail-amberDark flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-trail-amber flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={12} className="text-trail-amberText" />
                  </div>
                  <div>
                    <div className="font-medium text-trail-text">Path out of sync</div>
                    <div className="font-sans text-sm text-trail-muted mt-0.5">
                      Your goal changed to <span className="font-semibold text-trail-text">"{profile.goal}"</span>. Generate a new path tailored to this goal?
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => regeneratePath()}
                    disabled={generatingPath}
                    className="px-3 py-1.5 rounded-lg bg-trail-amber text-trail-amberText hover:bg-trail-amber/90 disabled:opacity-60 font-medium text-sm transition-colors"
                  >
                    {generatingPath ? "Generating..." : "Generate"}
                  </button>
                  <button
                    onClick={() => setShowPathRegeneratePrompt(false)}
                    className="px-3 py-1.5 rounded-lg bg-trail-surface2 text-trail-text hover:bg-trail-surface border border-trail-border font-medium text-sm transition-colors"
                  >
                    Keep current
                  </button>
                </div>
              </div>
            )}

            <Dashboard
              profile={profile}
              path={path}
              setPath={setPath}
              skills={skills}
              activity={activity}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
            />
          </>
        )}
      </div>
    </div>
  );
}
