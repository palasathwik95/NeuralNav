"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { ActivityDay } from "@/lib/types";

export default function ActivityChart({ activity }: { activity: ActivityDay[] }) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={activity} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} stroke="#3A4C43" />
          <XAxis dataKey="day" tick={{ fill: "#93A89D", fontSize: 11 }} axisLine={{ stroke: "#3A4C43" }} tickLine={false} />
          <YAxis tick={{ fill: "#93A89D", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#283C34", border: "1px solid #3A4C43", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#EFEAD9" }}
            itemStyle={{ color: "#4FB6A0" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="minutes" fill="#E3A542" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
