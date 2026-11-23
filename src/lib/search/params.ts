import { z } from "zod";
import { listingConditions } from "@/lib/data/types";

export const sortOptions = ["newest", "price_asc", "price_desc"] as const;
export type SortOption = (typeof sortOptions)[number];

export const SEARCH_PAGE_SIZE = 24;
const MAX_PRICE = 100_000_000_000; // 100 billion FCFA – sanity ceiling
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64);

export interface SearchQuery {
  q?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: (typeof listingConditions)[number];
  sort: SortOption;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const blankToUndefined = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const fields = {
  q: z.string().trim().min(1).max(100),
  category: slug,
  city: slug,
  minPrice: z.coerce.number().int().min(0).max(MAX_PRICE),
  maxPrice: z.coerce.number().int().min(0).max(MAX_PRICE),
  condition: z.enum(listingConditions),
  sort: z.enum(sortOptions),
  page: z.coerce.number().int().min(1).max(500),
} as const;

/**
 * Parses URL search params into a safe query. Invalid individual values are
 * dropped (and reported) rather than failing the whole page, so shared links
 * keep working even when edited by hand.
 */
export function parseSearchParams(raw: RawParams): { query: SearchQuery; invalid: string[] } {
  const invalid: string[] = [];
  const out: Partial<SearchQuery> = {};

  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    const value = blankToUndefined(first(raw[key]));
    if (value === undefined) continue;
    const result = fields[key].safeParse(value);
    if (result.success) (out as Record<string, unknown>)[key] = result.data;
    else invalid.push(key);
  }

  if (out.minPrice !== undefined && out.maxPrice !== undefined && out.minPrice > out.maxPrice) {
    [out.minPrice, out.maxPrice] = [out.maxPrice, out.minPrice];
  }

  return {
    query: { ...out, sort: out.sort ?? "newest", page: out.page ?? 1 },
    invalid,
  };
}

/** Serialises a query back to a clean, shareable query string (defaults omitted). */
export function toSearchString(query: Partial<SearchQuery>): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.city) params.set("city", query.city);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.condition) params.set("condition", query.condition);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Escapes user input for use inside a PostgreSQL ILIKE / full-text query. */
export function toTsQuery(q: string): string | null {
  const terms = q
    .toLowerCase()
    .normalize("NFKC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 0)
    .slice(0, 8);
  return terms.length ? terms.map((t) => `${t}:*`).join(" & ") : null;
}
