import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicStorageUrl } from "@/lib/supabase/public-client";
import { toTsQuery } from "@/lib/search/params";
import type { MarketplaceRepository } from "./repository";
import {
  mapCategoryRow,
  mapCityRow,
  mapListingCardRow,
  mapRegionRow,
  type CategoryRow,
  type CityRow,
  type ListingCardRow,
  type RegionRow,
} from "./mappers";

const CARD_COLUMNS =
  "id, slug, title, price_xaf, is_negotiable, condition, category_id, city_slug, city_name_en, city_name_fr, neighbourhood_name, cover_image_path, published_at, seller_type";

function fail(context: string, error: { message: string }): never {
  throw new Error(`[wakati:data] ${context}: ${error.message}`);
}

/** The subset of the PostgREST filter builder used by search (structural, so it fits any select). */
interface Filterable {
  in(column: string, values: readonly unknown[]): Filterable;
  eq(column: string, value: unknown): Filterable;
  gte(column: string, value: unknown): Filterable;
  lte(column: string, value: unknown): Filterable;
  textSearch(column: string, query: string, options?: { config?: string }): Filterable;
}

function applySearchFilters<T>(request: T, query: Parameters<MarketplaceRepository["searchListings"]>[0]): T {
  // Cast at the boundary: Supabase's builder types are too deep for a generic constraint.
  let r = request as unknown as Filterable;
  if (query.categoryIds?.length) r = r.in("category_id", query.categoryIds);
  if (query.cityId) r = r.eq("city_id", query.cityId);
  if (query.minPrice !== undefined) r = r.gte("price_xaf", query.minPrice);
  if (query.maxPrice !== undefined) r = r.lte("price_xaf", query.maxPrice);
  if (query.condition) r = r.eq("condition", query.condition);
  const ts = query.q ? toTsQuery(query.q) : null;
  if (ts) r = r.textSearch("search_vector", ts, { config: "simple" });
  return r as unknown as T;
}

export function createSupabaseRepository(db: SupabaseClient): MarketplaceRepository {
  const toCard = (row: ListingCardRow) =>
    mapListingCardRow(row, (path) => publicStorageUrl("listing-images", path));

  return {
    source: "database",

    async listCategories() {
      const { data, error } = await db
        .from("categories")
        .select(
          "id, parent_id, slug, name_en, name_fr, icon, sort_order, has_condition, moderation_level, category_attributes (key, data_type, label_en, label_fr, options, is_required, is_filterable, min_value, max_value, unit, sort_order)",
        )
        .eq("is_active", true)
        .order("sort_order");
      if (error) fail("categories", error);
      return (data as CategoryRow[]).map(mapCategoryRow);
    },

    async listRegions() {
      const { data, error } = await db
        .from("regions")
        .select("id, slug, name_en, name_fr, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) fail("regions", error);
      return (data as RegionRow[]).map(mapRegionRow);
    },

    async listCities() {
      const { data, error } = await db
        .from("cities")
        .select("id, region_id, slug, name_en, name_fr, is_featured, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) fail("cities", error);
      return (data as CityRow[]).map(mapCityRow);
    },

    async latestListings(limit) {
      const { data, error } = await db
        .from("public_listing_cards")
        .select(CARD_COLUMNS)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) fail("latest listings", error);
      return (data as ListingCardRow[]).map(toCard);
    },

    async featuredListings(limit) {
      const { data, error } = await db
        .from("public_listing_cards")
        .select(CARD_COLUMNS)
        .eq("is_featured_now", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) fail("featured listings", error);
      return (data as ListingCardRow[]).map(toCard);
    },

    async searchListings(query, pageSize) {
      // The same filters are used for the page of results and, when needed, for the count.
      const filtered = <T,>(request: T): T => applySearchFilters(request, query);

      let request = filtered(db.from("public_listing_cards").select(CARD_COLUMNS, { count: "exact" }));
      if (query.sort === "price_asc") request = request.order("price_xaf", { ascending: true, nullsFirst: false });
      else if (query.sort === "price_desc") request = request.order("price_xaf", { ascending: false, nullsFirst: false });
      request = request.order("published_at", { ascending: false });

      const from = (query.page - 1) * pageSize;
      const { data, error, count } = await request.range(from, from + pageSize - 1);

      // A page beyond the last one (e.g. a shared link after listings were removed) is
      // not an error: PostgREST answers 416 / PGRST103. Return an empty page that still
      // reports the real total, so the UI shows the empty state and pagination.
      if (error && (error.code === "PGRST103" || /range not satisfiable/i.test(error.message))) {
        const counted = await filtered(
          db.from("public_listing_cards").select("id", { count: "exact", head: true }),
        );
        if (counted.error) fail("search count", counted.error);
        const total = counted.count ?? 0;
        return { items: [], total, page: query.page, pageSize, pageCount: Math.ceil(total / pageSize) };
      }
      if (error) fail("search", error);

      const total = count ?? 0;
      return {
        items: (data as ListingCardRow[]).map(toCard),
        total,
        page: query.page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      };
    },
  };
}
