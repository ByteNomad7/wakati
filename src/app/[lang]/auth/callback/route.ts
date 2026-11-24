import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { authErrorReason, isAcceptedOtpType, safeNextPath, type AuthErrorReason } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Supabase Auth email-link callback: /{lang}/auth/callback
 *
 * Handles both link styles Supabase can produce:
 *  - PKCE:        ?code=…                     → exchangeCodeForSession
 *  - Token hash:  ?token_hash=…&type=signup   → verifyOtp
 * On success the session cookies are set and the user is redirected to a safe,
 * same-site path; on failure to /{lang}/auth/error. These URLs must be listed in
 * Supabase → Authentication → URL Configuration (see docs/SUPABASE.md).
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/[lang]/auth/callback">) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const url = request.nextUrl;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, url.origin), { status: 303 });
  const fail = (reason: AuthErrorReason) => redirectTo(`/${locale}/auth/error?reason=${reason}`);

  // Supabase reports link problems (e.g. expired) as query parameters.
  const linkError = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  if (linkError) return fail(authErrorReason(url.searchParams.get("error_code")));

  if (!isSupabaseConfigured()) return fail("unavailable");
  const supabase = await getServerSupabase();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  let error: { code?: string } | null = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && isAcceptedOtpType(type)) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else {
    return fail("invalid");
  }
  if (error) return fail(authErrorReason(error.code));

  return redirectTo(safeNextPath(url.searchParams.get("next"), locale));
}
