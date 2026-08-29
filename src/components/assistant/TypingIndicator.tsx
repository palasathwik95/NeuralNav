"use client";

import { Compass } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start" role="status" aria-label="Pathfinder is typing">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-trail-surface2 border border-trail-border"
        aria-hidden="true"
      >
        <Compass size={14} className="text-trail-amber" />
      </div>
      <div className="rounded-2xl px-4 py-3 flex gap-1.5 items-center bg-trail-surface2 border border-trail-border">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-trail-faint"
            style={{
              animation: `trailhead-bounce 1.1s ${i * 0.18}s infinite ease-in-out`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
