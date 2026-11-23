export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

/** English is the initial default (brief §13); French is fully equivalent. */
export const defaultLocale: Locale = "en";

/** Cookie remembering an explicit language choice. */
export const LOCALE_COOKIE = "WAKATI_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** BCP-47 tags used for Intl formatting and hreflang. */
export const localeTags: Record<Locale, string> = {
  en: "en-CM",
  fr: "fr-CM",
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};
