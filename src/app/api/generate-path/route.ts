import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer, isSupabaseServerConfigured } from "@/lib/supabaseServer";
import { DEMO_USER_ID } from "@/lib/supabaseClient";
import { generatePath, GeneratedWaypoint } from "@/lib/pathGenerator";
import { MOCK_PROFILE, MOCK_SKILLS } from "@/lib/mockData";
import { Profile, SkillScore } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Rewrites each module's "reason" text to sound personalized, WITHOUT ever
// letting the model add, remove, reorder, or rename modules — it only gets
// to touch the reason strings. If this fails or times out, the caller
// keeps the deterministic reasons generatePath() already produced.
async function personalizeReasons(profile: Profile, waypoints: GeneratedWaypoint[]): Promise<Record<string, string>> {
  try {
    const prompt = `Student profile: ${JSON.stringify({ goal: profile.goal, style: profile.style, interests: profile.interests })}

Modules in their learning path, in order, each with a generic reason:
${waypoints.map((w) => `- ${w.moduleId}: "${w.title}" (${w.status}) — ${w.reason}`).join("\n")}

Rewrite ONLY the reason text for each module so it sounds warm and specific to this student's interests and learning style, under 18 words each. Do not rename, reorder, add, or remove modules.
Respond with ONLY a JSON object mapping moduleId to the new reason string — no other text.`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as Record<string, string>;
  } catch (err) {
    console.warn("generate-path: personalization skipped", err);
    return {};
  }
}

export async function POST() {
  try {
    let profile: Profile = MOCK_PROFILE;
    let skills: SkillScore[] = MOCK_SKILLS;

    if (isSupabaseServerConfigured) {
      const { data: p } = await supabaseServer.from("profiles").select("*").eq("user_id", DEMO_USER_ID).maybeSingle();
      const { data: sk } = await supabaseServer.from("skill_scores").select("skill, value").eq("user_id", DEMO_USER_ID);
      if (p) {
        profile = {
          name: p.name,
          goal: p.goal,
          level: p.level,
          weeklyHours: p.weekly_hours,
          style: p.style,
          interests: p.interests ?? [],
          streakDays: p.streak_days,
          xp: p.xp,
          xpToNext: p.xp_to_next,
        };
      }
      if (sk && sk.length > 0) skills = sk;
    }

    const generated = generatePath(profile, skills);
    const personalized = await personalizeReasons(profile, generated);
    const waypoints = generated.map((w) => ({ ...w, reason: personalized[w.moduleId] ?? w.reason }));

    if (isSupabaseServerConfigured) {
      await supabaseServer.from("path_waypoints").delete().eq("user_id", DEMO_USER_ID);
      await supabaseServer.from("path_waypoints").insert(
        waypoints.map((w, i) => ({
          user_id: DEMO_USER_ID,
          title: w.title,
          status: w.status,
          weeks: w.weeks,
          order_index: i,
          reason: w.reason,
        }))
      );
    }

    return NextResponse.json({ waypoints });
  } catch (err) {
    console.error("generate-path error", err);
    return NextResponse.json({ error: "Could not generate a path right now." }, { status: 500 });
  }
}
