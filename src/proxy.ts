import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { negotiateLocale } from "@/i18n/negotiate";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Locale routing. Every page lives under /en or /fr.
 * - Paths without a locale are redirected to the negotiated locale.
 * - Visiting a locale path remembers it, so "/" sends people back to their language.
 *
 * Phase B: Supabase session refresh will be added here (see docs/ARCHITECTURE.md).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (isLocale(firstSegment)) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      response.cookies.set(LOCALE_COOKIE, firstSegment, {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "lax",
      });
    }
    return response;
  }

  const locale = negotiateLocale(
    request.headers.get("accept-language"),
    request.cookies.get(LOCALE_COOKIE)?.value,
  );
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip Next internals, API routes, metadata files and anything with a file extension.
    "/((?!_next|api|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|brand/|icons/|.*\\..*).*)",
  ],
};
