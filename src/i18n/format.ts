import { localeTags, type Locale } from "./config";

/**
 * Formats an amount in Central African CFA francs (XAF).
 * XAF has no minor unit in practice; amounts are stored as whole francs.
 * Output: "250,000 FCFA" (en) / "250 000 FCFA" (fr).
 */
export function formatPrice(amountXaf: number, locale: Locale): string {
  const number = new Intl.NumberFormat(localeTags[locale], {
    maximumFractionDigits: 0,
  })
    .format(Math.round(amountXaf))
    // Normalise narrow/regular no-break spaces so output is stable across ICU versions.
    .replace(/[  ]/g, " ");
  return `${number} FCFA`;
}

export function formatDate(value: string | Date, locale: Locale): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Douala",
  }).format(date);
}

/** Minimal `{name}` interpolation for dictionary strings. */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
