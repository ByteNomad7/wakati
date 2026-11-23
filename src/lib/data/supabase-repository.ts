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
      let request = db.from("public_listing_cards").select(CARD_COLUMNS, { count: "exact" });

      if (query.categoryIds?.length) request = request.in("category_id", query.categoryIds);
      if (query.cityId) request = request.eq("city_id", query.cityId);
      if (query.minPrice !== undefined) request = request.gte("price_xaf", query.minPrice);
      if (query.maxPrice !== undefined) request = request.lte("price_xaf", query.maxPrice);
      if (query.condition) request = request.eq("condition", query.condition);
      const ts = query.q ? toTsQuery(query.q) : null;
      if (ts) request = request.textSearch("search_vector", ts, { config: "simple" });

      if (query.sort === "price_asc") request = request.order("price_xaf", { ascending: true, nullsFirst: false });
      else if (query.sort === "price_desc") request = request.order("price_xaf", { ascending: false, nullsFirst: false });
      request = request.order("published_at", { ascending: false });

      const from = (query.page - 1) * pageSize;
      const { data, error, count } = await request.range(from, from + pageSize - 1);
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
