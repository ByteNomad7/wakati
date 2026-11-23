import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { defaultLocale, isLocale, locales, type Locale } from "./config";

/**
 * Picks a locale for a request without one in the URL:
 * 1. an explicit choice stored in the locale cookie,
 * 2. the browser's Accept-Language header,
 * 3. the default locale.
 */
export function negotiateLocale(
  acceptLanguage: string | null | undefined,
  cookieLocale: string | null | undefined,
): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;
  if (!acceptLanguage) return defaultLocale;
  try {
    const languages = new Negotiator({
      headers: { "accept-language": acceptLanguage },
    }).languages();
    const picked = match(languages, [...locales], defaultLocale);
    return isLocale(picked) ? picked : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
