import type { Metadata } from "next";
import { defaultLocale, localeTags, locales, type Locale } from "@/i18n/config";
import { localePath } from "@/i18n/paths";
import { indexingAllowed, siteUrl } from "@/lib/env";

/** Canonical + hreflang alternates for a locale-independent path such as "/c/cars". */
export function alternatesFor(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeTags[l]] = absoluteUrl(localePath(l, path));
  languages["x-default"] = absoluteUrl(localePath(defaultLocale, path));
  return { canonical: absoluteUrl(localePath(locale, path)), languages };
}

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  index = true,
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  index?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    robots:
      index && indexingAllowed()
        ? { index: true, follow: true }
        : { index: false, follow: indexingAllowed() },
    openGraph: {
      title,
      description,
      url: absoluteUrl(localePath(locale, path)),
      siteName: "Wakati",
      locale: localeTags[locale].replace("-", "_"),
      type: "website",
      images: [{ url: absoluteUrl("/icons/wakati-icon-512.png"), width: 512, height: 512, alt: "Wakati" }],
    },
  };
}

/** Serialises JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
