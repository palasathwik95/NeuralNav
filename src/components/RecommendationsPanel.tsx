"use client";

import { Sparkles, Zap, Target } from "lucide-react";
import { Suggestion } from "@/lib/types";

interface RecommendationsPanelProps {
  recommendations: Suggestion[];
  skillOverview?: {
    topSkills: Array<{ skill: string; value: number }>;
    averageLevel: number;
    skillCount: number;
  };
  onSelectRecommendation?: (rec: Suggestion) => void;
  loading?: boolean;
}

export default function RecommendationsPanel({
  recommendations,
  skillOverview,
  onSelectRecommendation,
  loading = false,
}: RecommendationsPanelProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-trail-surface border border-trail-border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-trail-teal animate-pulse" />
          <span className="font-display font-semibold text-[15px] text-trail-text">Loading recommendations...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg p-3 bg-trail-surface2 animate-pulse h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Skill Overview */}
      {skillOverview && skillOverview.skillCount > 0 && (
        <div className="rounded-2xl p-5 bg-trail-surface border border-trail-border">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-trail-amber" />
            <span className="font-display font-semibold text-[15px] text-trail-text">Your Skills</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-trail-muted">Average Level</span>
              <span className="font-semibold text-trail-text">{skillOverview.averageLevel}%</span>
            </div>
            {skillOverview.topSkills.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="text-[12px] text-trail-muted mb-2">Top Skills:</div>
                {skillOverview.topSkills.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between text-xs">
                    <span className="text-trail-text">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 rounded-full h-1.5 bg-trail-surface2">
                        <div
                          className="h-full bg-trail-teal rounded-full"
                          style={{ width: `${skill.value}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-trail-muted">{skill.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div className="rounded-2xl p-5 bg-trail-surface border border-trail-tealDark">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-trail-teal" />
            <span className="font-display font-semibold text-[15px] text-trail-text">Recommended for You</span>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectRecommendation?.(rec)}
                className="rounded-lg p-3 bg-trail-surface2 hover:bg-trail-border cursor-pointer transition-colors border border-trail-border"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium text-sm text-trail-text truncate">{rec.title}</div>
                    <div className="font-sans text-[11.5px] text-trail-muted mt-0.5 line-clamp-2">{rec.reason}</div>
                  </div>
                  <div className="ml-2 p-1 rounded bg-trail-teal/20">
                    <Sparkles size={14} className="text-trail-teal" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-5 bg-trail-surface border border-trail-border">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Target size={24} className="text-trail-muted mb-2 opacity-50" />
            <div className="font-sans text-sm text-trail-muted max-w-xs">
              No recommendations yet. Complete your profile and waypoints to get personalized suggestions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
