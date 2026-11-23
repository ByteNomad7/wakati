import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/public-client";
import { SEARCH_PAGE_SIZE, type SearchQuery } from "@/lib/search/params";
import { descendantIds, findCategoryBySlug } from "./category-tree";
import { referenceRepository } from "./reference-repository";
import type { MarketplaceRepository } from "./repository";
import { createSupabaseRepository } from "./supabase-repository";

/** Cache tags; Phase B mutations call updateTag() with these after writes. */
export const cacheTags = {
  catalog: "catalog",
  listings: "listings",
} as const;

function repository(): MarketplaceRepository {
  const db = getPublicSupabase();
  return db ? createSupabaseRepository(db) : referenceRepository;
}

/** Categories, regions and cities change rarely: cached for hours, tagged for on-demand refresh. */
export async function getCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.catalog);
  const repo = repository();
  const [categories, regions, cities] = await Promise.all([
    repo.listCategories(),
    repo.listRegions(),
    repo.listCities(),
  ]);
  return { categories, regions, cities, source: repo.source };
}

export async function getLatestListings(limit = 8) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.listings);
  return repository().latestListings(limit);
}

/** Only staff-flagged, currently-featured published listings. Empty when there are none. */
export async function getFeaturedListings(limit = 4) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.listings);
  return repository().featuredListings(limit);
}

export async function searchListings(query: SearchQuery) {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.listings);
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
