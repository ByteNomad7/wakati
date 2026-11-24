import "server-only";
import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/public-client";
import { SEARCH_PAGE_SIZE, type SearchQuery } from "@/lib/search/params";
import { descendantIds, findCategoryBySlug } from "./category-tree";
import { referenceRepository } from "./reference-repository";
import type { MarketplaceRepository } from "./repository";
import { createSupabaseRepository } from "./supabase-repository";
import { createTtlCache } from "./ttl-cache";

/**
 * Data access for pages.
 *
 * Caching policy (Cloudflare-compatible, no Cache Components):
 * - Reference data (categories, regions, cities): in-memory, 5 minutes per instance.
 *   Category or city edits by admins appear within 5 minutes.
 * - Listings: never cached. Every request reads published listings from Supabase,
 *   so new, edited or removed listings are reflected immediately.
 * - React `cache()` deduplicates identical calls within one request.
 */
export const CATALOG_TTL_MS = 5 * 60 * 1000;

function repository(): MarketplaceRepository {
  const db = getPublicSupabase();
  return db ? createSupabaseRepository(db) : referenceRepository;
}

const catalogCache = createTtlCache(async () => {
  const repo = repository();
  const [categories, regions, cities] = await Promise.all([
    repo.listCategories(),
    repo.listRegions(),
    repo.listCities(),
  ]);
  return { categories, regions, cities, source: repo.source };
}, CATALOG_TTL_MS);

/** Categories, regions and cities (shared by the header, footer and pages). */
export const getCatalog = cache(() => catalogCache.get());

/** For Phase B admin tools: drop this instance's copy after editing reference data. */
export function invalidateCatalog(): void {
  catalogCache.invalidate();
}

export const getLatestListings = cache((limit: number = 8) => repository().latestListings(limit));

/** Only staff-flagged, currently-featured published listings. Empty when there are none. */
export const getFeaturedListings = cache((limit: number = 4) => repository().featuredListings(limit));

export async function searchListings(query: SearchQuery) {
  const { categories, cities } = await getCatalog();
  const category = query.category ? findCategoryBySlug(categories, query.category) : undefined;
  const city = query.city ? cities.find((c) => c.slug === query.city) : undefined;

  // Unknown slugs in a shared URL produce an empty result rather than ignoring the filter.
  if ((query.category && !category) || (query.city && !city)) {
    return { items: [], total: 0, page: query.page, pageSize: SEARCH_PAGE_SIZE, pageCount: 0 };
  }

  const { category: _c, city: _ci, ...rest } = query;
  void _c;
  void _ci;
  return repository().searchListings(
    {
      ...rest,
      categoryIds: category ? descendantIds(categories, category.id) : undefined,
      cityId: city?.id,
    },
    SEARCH_PAGE_SIZE,
  );
}
