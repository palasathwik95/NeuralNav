"use client";

import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Waypoint, WaypointStatus } from "@/lib/types";

function Icon({ status }: { status: WaypointStatus }) {
  if (status === "done") return <CheckCircle2 size={16} className="text-trail-teal" />;
  if (status === "active") return <Circle size={16} className="text-trail-amber" fill="#E3A542" />;
  if (status === "locked") return <Lock size={16} className="text-trail-locked" />;
  return <Circle size={16} className="text-trail-teal" />;
}

export default function PathDetailsList({ path }: { path: Waypoint[] }) {
  return (
    <div className="flex flex-col mt-2">
      {path.map((w) => (
        <div key={w.id} className="flex items-start gap-3 py-3 border-t border-trail-border">
          <div className="mt-0.5 shrink-0">
            <Icon status={w.status} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-sans font-medium text-sm text-trail-text">{w.title}</span>
              <span className="font-mono text-[11px] text-trail-muted shrink-0">
                {w.weeks} wk{w.weeks > 1 ? "s" : ""}
              </span>
            </div>
            {w.reason && <div className="font-sans text-[12.5px] text-trail-muted mt-0.5">{w.reason}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
