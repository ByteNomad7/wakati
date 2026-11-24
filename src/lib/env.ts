import { z } from "zod";

/**
 * Public (browser-safe) environment. Server-only secrets such as the Supabase
 * service role key are NOT read here and must never be prefixed with NEXT_PUBLIC_.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  /** Publishable key (sb_publishable_…). Legacy projects may use the anon JWT instead. */
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.email().optional(),
  NEXT_PUBLIC_SHOW_LAYOUT_PLACEHOLDERS: z.enum(["true", "false"]).default("false"),
});

const emptyToUndefined = (v: string | undefined) => (v === undefined || v.trim() === "" ? undefined : v);

function readPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_SUPABASE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
    // Fallback keeps older .env files (legacy anon key) working.
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
      emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPPORT_EMAIL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
    NEXT_PUBLIC_SHOW_LAYOUT_PLACEHOLDERS: emptyToUndefined(process.env.NEXT_PUBLIC_SHOW_LAYOUT_PLACEHOLDERS),
  });
  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export const publicEnv = readPublicEnv();

export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** Layout placeholders are a development aid and can never render in production builds. */
export function showLayoutPlaceholders(): boolean {
  return process.env.NODE_ENV !== "production" && publicEnv.NEXT_PUBLIC_SHOW_LAYOUT_PLACEHOLDERS === "true";
}
