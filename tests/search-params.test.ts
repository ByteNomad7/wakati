import { describe, expect, it } from "vitest";
import { parseSearchParams, toSearchString, toTsQuery } from "@/lib/search/params";
import { mapListingCardRow } from "@/lib/data/mappers";

describe("search params", () => {
  it("applies defaults", () => {
    expect(parseSearchParams({})).toEqual({ query: { sort: "newest", page: 1 }, invalid: [] });
  });

  it("parses a full query and round-trips to a clean URL", () => {
    const { query, invalid } = parseSearchParams({
      q: "  Toyota Corolla ",
      city: "douala",
      category: "cars",
      minPrice: "1000000",
      maxPrice: "5000000",
      condition: "good",
      sort: "price_asc",
      page: "2",
    });
    expect(invalid).toEqual([]);
    expect(query).toEqual({
      q: "Toyota Corolla", city: "douala", category: "cars", minPrice: 1_000_000, maxPrice: 5_000_000,
      condition: "good", sort: "price_asc", page: 2,
    });
    expect(toSearchString(query)).toBe(
      "?q=Toyota+Corolla&category=cars&city=douala&minPrice=1000000&maxPrice=5000000&condition=good&sort=price_asc&page=2",
    );
  });

  it("drops invalid values instead of failing", () => {
    const { query, invalid } = parseSearchParams({ city: "../etc", page: "-3", sort: "random", minPrice: "abc", q: "ok" });
    expect(query).toEqual({ q: "ok", sort: "newest", page: 1 });
    expect(invalid.sort()).toEqual(["city", "minPrice", "page", "sort"]);
  });

  it("swaps an inverted price range and ignores blank values", () => {
    const { query } = parseSearchParams({ minPrice: "900", maxPrice: "100", q: "   ", city: "" });
    expect(query.minPrice).toBe(100);
    expect(query.maxPrice).toBe(900);
    expect(query.q).toBeUndefined();
  });

  it("uses the first value when a parameter is repeated", () => {
    expect(parseSearchParams({ city: ["buea", "limbe"] }).query.city).toBe("buea");
  });

  it("omits defaults from shareable URLs", () => {
    expect(toSearchString({ sort: "newest", page: 1 })).toBe("");
    expect(toSearchString({ city: "kribi" })).toBe("?city=kribi");
  });

  it("builds safe prefix full-text queries, including accented words", () => {
    expect(toTsQuery("Yaoundé  villa & 'pool'")).toBe("yaoundé:* & villa:* & pool:*");
    expect(toTsQuery("!!! ---")).toBeNull();
  });
});

describe("row mapping", () => {
  it("maps a public listing row and converts bigint prices", () => {
    const card = mapListingCardRow(
      {
        id: "1", slug: "toyota-1", title: "Toyota", price_xaf: "2500000", is_negotiable: true, condition: "good",
        category_id: "c", city_slug: "douala", city_name_en: "Douala", city_name_fr: "Douala",
        neighbourhood_name: null, cover_image_path: "u/l/1.webp", published_at: "2026-11-01T10:00:00Z", seller_type: "private",
      },
      (p) => (p ? `https://cdn.test/${p}` : null),
    );
    expect(card.priceXaf).toBe(2_500_000);
    expect(card.coverImageUrl).toBe("https://cdn.test/u/l/1.webp");
    expect(card.cityName).toEqual({ en: "Douala", fr: "Douala" });
  });
});
