// GET    /api/chat/history  — returns the current session's chat history
// DELETE /api/chat/history  — clears the current session's chat history
//
// Uses an in-memory store (no Supabase required). History resets when the
// Next.js server process restarts. This is intentional for the no-DB mode.

import { NextResponse } from "next/server";
import { sessionHistory } from "@/lib/ai/sessionStore";

// ---------------------------------------------------------------------------
// GET /api/chat/history
// ---------------------------------------------------------------------------

export async function GET() {
  const messages = sessionHistory.getAll();
  return NextResponse.json({ messages });
}

// ---------------------------------------------------------------------------
// DELETE /api/chat/history
// ---------------------------------------------------------------------------

export async function DELETE() {
  sessionHistory.clear();
  return NextResponse.json({ success: true });
}
