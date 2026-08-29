import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key so the API route can write
// chat-derived profile/path/suggestion updates regardless of RLS. Never
// import this file from a "use client" component.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseServer = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

export const isSupabaseServerConfigured = Boolean(url && serviceKey);
