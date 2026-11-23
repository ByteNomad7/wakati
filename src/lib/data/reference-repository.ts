import { referenceCategories } from "@/lib/reference/categories";
import { referenceCities, referenceRegions } from "@/lib/reference/locations";
import { emptyPage, type MarketplaceRepository } from "./repository";

/** Fallback when no database is configured: reference data only, zero listings. */
export const referenceRepository: MarketplaceRepository = {
  source: "reference",
  listCategories: async () => referenceCategories(),
  listRegions: async () => referenceRegions(),
  listCities: async () => referenceCities(),
  latestListings: async () => [],
  featuredListings: async () => [],
  searchListings: async (query, pageSize) => emptyPage(query.page, pageSize),
};
