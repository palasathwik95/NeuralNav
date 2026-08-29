"use client";

import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Waypoint, WaypointStatus } from "@/lib/types";

function catmullRom2bezier(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y} `;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y} `;
  }
  return d;
}

function statusFill(status: WaypointStatus) {
  switch (status) {
    case "done":
      return { fill: "#4FB6A0", stroke: "#2E8272" };
    case "active":
      return { fill: "#E3A542", stroke: "#B87F27" };
    case "upcoming":
      return { fill: "#283C34", stroke: "#4FB6A0" };
    default:
      return { fill: "#283C34", stroke: "#5B6B63" };
  }
}

function StatusIcon({ status }: { status: WaypointStatus }) {
  if (status === "done") return <CheckCircle2 size={15} className="text-trail-teal" />;
  if (status === "active") return <Circle size={15} className="text-trail-amber" fill="#E3A542" />;
  if (status === "locked") return <Lock size={15} className="text-trail-locked" />;
  return <Circle size={15} className="text-trail-teal" />;
}

export default function TrailMap({ path }: { path: Waypoint[] }) {
  const W = 860,
    H = 190,
    PAD = 55;
  const n = path.length;
  const points = path.map((_, i) => ({
    x: PAD + (i * (W - 2 * PAD)) / Math.max(n - 1, 1),
    y: H / 2 + Math.sin(i * 1.15) * (H * 0.3),
  }));
  const d = catmullRom2bezier(points);

  return (
    <div className="relative w-full" style={{ height: 190 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d={d} fill="none" stroke="#3A4C43" strokeWidth={3} strokeDasharray="1 10" strokeLinecap="round" />
        {points.slice(0, -1).map((p, i) => {
          const done = path[i].status === "done" && path[i + 1].status !== "locked";
          if (!done) return null;
          const seg = catmullRom2bezier([points[i], points[i + 1]]);
          return <path key={i} d={seg} fill="none" stroke="#4FB6A0" strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
        })}
      </svg>
      {points.map((p, i) => {
        const sc = statusFill(path[i].status);
        return (
          <div
            key={path[i].id}
            className="absolute flex flex-col items-center"
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`, transform: "translate(-50%,-50%)" }}
          >
            {path[i].status === "active" && (
              <div className="mb-1 px-2 py-0.5 rounded-full whitespace-nowrap bg-trail-amber text-trail-amberText text-[10px] font-semibold font-sans">
                you are here
              </div>
            )}
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: 34, height: 34, background: sc.fill, border: `2px solid ${sc.stroke}` }}
            >
              <StatusIcon status={path[i].status} />
            </div>
            <div className="mt-1 text-center leading-tight text-[11px] font-sans text-trail-muted" style={{ width: 96 }}>
              {path[i].title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
