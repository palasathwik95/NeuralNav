import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

// If env vars aren't set yet (e.g. running before Supabase is wired up by
// the Profile Engine owner), fall back to a placeholder URL so the client
// constructor doesn't throw at import time — every call site checks
// isSupabaseConfigured first, so this client is simply never used in that
// case. The hooks in this app fall back to mock data. See src/lib/mockData.ts.
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-anon-key");

// TODO(auth): replace with the authenticated user's id once the sign-in
// flow lands. Every table is RLS-scoped to user_id, so this is the one
// constant to swap out.
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
