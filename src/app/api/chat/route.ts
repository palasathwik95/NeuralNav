import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer, isSupabaseServerConfigured } from "@/lib/supabaseServer";
import { DEMO_USER_ID } from "@/lib/supabaseClient";
import { ChatMessage, Profile, ProfileDelta, PathSuggestionPayload } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function systemPrompt(profile: Profile) {
  return `You are "Pathfinder", the conversational mentor inside Trailhead, a personalized-learning platform. You are talking with a real student mid-program, not onboarding a stranger.

What you already know about this student (do not ask for facts already listed here):
${JSON.stringify(profile, null, 2)}

Your job in this conversation:
1. Be warm, encouraging, and concise (aim for under 70 words per reply). Ask at most one follow-up question per turn.
2. Help the student reflect on their goal, current skill level, available time, learning style, and interests, and help them think through their learning path.
3. When you learn a concrete NEW fact that should update their profile, append a hidden line in exactly this format (this is stripped before the student ever sees it, so never mention it or show it):
<<PROFILE_DELTA>>{"weeklyHours":6}<<END>>
Only include fields you actually learned this turn (any of: goal, level, weeklyHours, style, interests as an array). Omit the block entirely if nothing new was learned.
4. When a specific new learning module would clearly help them next, suggest ONE using this hidden format, sparingly (at most once every couple of turns, only when well justified):
<<PATH_SUGGESTION>>{"title":"CSS Grid & Layout Systems","reason":"You mentioned struggling with layout in your last project."}<<END>>
5. Never reveal these tags or their JSON to the student. They are backend signals only.`;
}

function extractBlock<T>(text: string, tag: string): { rest: string; data: T | null } {
  const re = new RegExp(`<<${tag}>>([\\s\\S]*?)<<END>>`);
  const match = text.match(re);
  if (!match) return { rest: text, data: null };
  const rest = text.replace(match[0], "").trim();
  try {
    return { rest, data: JSON.parse(match[1].trim()) as T };
  } catch {
    return { rest, data: null };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, profile }: { messages: ChatMessage[]; profile: Profile } = await req.json();

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt(profile) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const step1 = extractBlock<ProfileDelta>(raw, "PROFILE_DELTA");
    const step2 = extractBlock<PathSuggestionPayload>(step1.rest, "PATH_SUGGESTION");
    const reply = step2.rest.trim() || "Got it — noted for your path.";

    // Persist the turn + any deltas. Best-effort: the UI already has what
    // it needs from the response below, so a write failure here shouldn't
    // block the conversation.
    if (isSupabaseServerConfigured) {
      const lastUserMessage = messages[messages.length - 1];
      await supabaseServer.from("chat_messages").insert([
        { user_id: DEMO_USER_ID, role: "user", content: lastUserMessage?.content ?? "" },
        { user_id: DEMO_USER_ID, role: "assistant", content: reply },
      ]);

      if (step1.data) {
        await supabaseServer
          .from("profiles")
          .update({
            ...(step1.data.goal && { goal: step1.data.goal }),
            ...(step1.data.level && { level: step1.data.level }),
            ...(step1.data.weeklyHours !== undefined && { weekly_hours: step1.data.weeklyHours }),
            ...(step1.data.style && { style: step1.data.style }),
            ...(step1.data.interests && { interests: step1.data.interests }),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", DEMO_USER_ID);
      }

      if (step2.data) {
        await supabaseServer.from("mentor_suggestions").insert({
          user_id: DEMO_USER_ID,
          title: step2.data.title,
          reason: step2.data.reason,
          status: "pending",
        });
      }
    }

    return NextResponse.json({ reply, profileDelta: step1.data, pathSuggestion: step2.data });
  } catch (err) {
    console.error("chat route error", err);
    return NextResponse.json(
      { reply: "I lost the trail for a second there — mind sending that again?", profileDelta: null, pathSuggestion: null },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseServerConfigured) {
      return NextResponse.json({ messages: [] });
    }

    const { data, error } = await supabaseServer
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching chat history:", error);
      return NextResponse.json({ messages: [] });
    }

    const messages = (data || []).map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("chat history fetch error", err);
    return NextResponse.json({ messages: [] });
  }
}
