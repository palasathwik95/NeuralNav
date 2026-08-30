import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key so the API route can write
// chat-derived profile/path/suggestion updates regardless of RLS. Never
// import this file from a "use client" component.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseServerConfigured = Boolean(url && serviceKey);

// See supabaseClient.ts — same placeholder-fallback reasoning applies here
// so the module can be imported (e.g. during `next build`) even when
// Supabase env vars aren't set. Every call site checks
// isSupabaseServerConfigured before actually using this client.
export const supabaseServer = createClient(url || "https://placeholder.supabase.co", serviceKey || "placeholder-service-key", {
  auth: { persistSession: false },
});
