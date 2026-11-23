import type {
  Category,
  City,
  DataSource,
  ListingSummary,
  Paginated,
  Region,
} from "./types";
import type { SearchQuery } from "@/lib/search/params";

/**
 * Storage-agnostic data access used by pages. Phase A ships two implementations:
 * - SupabaseRepository: reads the real database (row-level security applies)
 * - ReferenceRepository: used when no database is configured; serves the launch
 *   categories/locations and returns NO listings (never invented activity).
 */
export interface MarketplaceRepository {
  readonly source: DataSource;
  listCategories(): Promise<Category[]>;
  listRegions(): Promise<Region[]>;
  listCities(): Promise<City[]>;
  latestListings(limit: number): Promise<ListingSummary[]>;
  featuredListings(limit: number): Promise<ListingSummary[]>;
  /** `categoryIds` already includes descendants of the requested category. */
  searchListings(
    query: Omit<SearchQuery, "category" | "city"> & { categoryIds?: string[]; cityId?: string },
    pageSize: number,
  ): Promise<Paginated<ListingSummary>>;
}

export function emptyPage<T>(page: number, pageSize: number): Paginated<T> {
  return { items: [], total: 0, page, pageSize, pageCount: 0 };
}
