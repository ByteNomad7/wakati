import type { LocalizedText } from "@/lib/data/types";
import type { Locale } from "./config";

/** Picks the right language from a database-stored bilingual field. */
export function localized(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en;
}
