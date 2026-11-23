import type { MetadataRoute } from "next";
import { localeTags, locales } from "@/i18n/config";
import { localePath, routes } from "@/i18n/paths";
import { getCatalog } from "@/lib/data/queries";
import { absoluteUrl } from "@/lib/seo/metadata";

/**
 * Indexable pages only: home and category pages, in both languages with hreflang.
 * Search results, draft legal pages and placeholders are excluded.
 * Phase B adds published listing URLs (never drafts, removed or pending listings).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories } = await getCatalog();
  const paths = ["/", ...categories.map((c) => routes.category(c.slug))];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [localeTags[l], absoluteUrl(localePath(l, path))])),
      },
    })),
  );
}
