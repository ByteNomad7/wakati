import { isLocale, type Locale } from "./config";

/**
 * Builds a locale-prefixed path. All internal links go through this helper so
 * that URLs stay shareable and crawlable per language (/en/..., /fr/...).
 */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Replace the locale segment of an existing pathname (used by the language switcher). */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }
  return localePath(target, pathname);
}

/** Path without its locale prefix, e.g. "/fr/search" -> "/search". */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    const rest = segments.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export const routes = {
  home: "/",
  search: "/search",
  category: (slug: string) => `/c/${encodeURIComponent(slug)}`,
  postAd: "/post-ad",
  login: "/login",
  register: "/register",
  favorites: "/favorites",
  legal: (doc: string) => `/legal/${doc}`,
} as const;
