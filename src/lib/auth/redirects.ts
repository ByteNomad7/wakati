import type { Locale } from "@/i18n/config";

/** Email link types Supabase Auth can send that this app accepts. */
export const acceptedOtpTypes = ["signup", "email", "recovery", "invite", "email_change", "magiclink"] as const;
export type AcceptedOtpType = (typeof acceptedOtpTypes)[number];

export function isAcceptedOtpType(value: string | null): value is AcceptedOtpType {
  return value !== null && (acceptedOtpTypes as readonly string[]).includes(value);
}

/**
 * Where to send the user after a successful email link. Only same-site paths in the
 * user's language are allowed, so a crafted `next` parameter cannot redirect to
 * another website (open redirect) or to a protocol-relative URL.
 */
export function safeNextPath(next: string | null, locale: Locale): string {
  const fallback = `/${locale}/auth/confirmed`;
  if (!next) return fallback;
  if (!next.startsWith(`/${locale}/`) && next !== `/${locale}`) return fallback;
  if (next.includes("//") || next.includes("\\") || /[\u0000-\u001f]/.test(next)) return fallback;
  try {
    const parsed = new URL(next, "https://wakati.invalid");
    if (parsed.origin !== "https://wakati.invalid") return fallback;
    return parsed.pathname + parsed.search;
  } catch {
    return fallback;
  }
}

export type AuthErrorReason = "expired" | "invalid" | "unavailable";

/** Maps Supabase Auth error codes (from the URL or the API) to a user-facing reason. */
export function authErrorReason(code: string | null | undefined): AuthErrorReason {
  return code === "otp_expired" || code === "flow_state_expired" ? "expired" : "invalid";
}
