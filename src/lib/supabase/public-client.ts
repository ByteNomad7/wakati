import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Anonymous, cookie-less client for public reads (categories, locations,
 * published listings). It has no user session, so row-level security limits it
 * to public data, and it is safe to use inside `"use cache"` scopes.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL!, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** Public URL for an object in a public storage bucket. */
export function publicStorageUrl(bucket: string, path: string | null): string | null {
  if (!path || !publicEnv.NEXT_PUBLIC_SUPABASE_URL) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encoded}`;
}
