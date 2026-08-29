"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { SkillScore } from "@/lib/types";

export default function SkillRadarChart({ skills }: { skills: SkillScore[] }) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <RadarChart data={skills} outerRadius="72%">
          <PolarGrid stroke="#3A4C43" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#93A89D", fontSize: 11 }} />
          <Radar dataKey="value" stroke="#4FB6A0" fill="#4FB6A0" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
