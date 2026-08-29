import { ReactNode } from "react";

export default function StatPill({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-trail-surface2 border border-trail-border">
      {icon}
      <div>
        <div className="font-mono text-[15px] text-trail-text leading-tight">{value}</div>
        <div className="font-sans text-[11px] text-trail-muted">{label}</div>
      </div>
    </div>
  );
}
