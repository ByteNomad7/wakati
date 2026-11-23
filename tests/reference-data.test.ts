import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { referenceCategories } from "@/lib/reference/categories";
import { citySeed, referenceCities, referenceRegions, regionSeed } from "@/lib/reference/locations";
import { buildSeedSql } from "@/lib/reference/seed-sql";
import {
  attributesSchema,
  buildCategoryTree,
  categoryPath,
  descendantIds,
  effectiveAttributes,
  findCategoryBySlug,
} from "@/lib/data/category-tree";

const categories = referenceCategories();
const bySlug = (slug: string) => findCategoryBySlug(categories, slug)!;

describe("categories", () => {
  it("has the 8 launch categories from the brief, in order", () => {
    expect(buildCategoryTree(categories).map((c) => c.name.en)).toEqual([
      "Vehicles", "Property", "Electronics", "Home & Garden", "Fashion", "Jobs & Services", "Agriculture", "Other Items",
    ]);
  });

  it("has the expected subcategories", () => {
    const tree = buildCategoryTree(categories);
    const counts = Object.fromEntries(tree.map((c) => [c.slug, c.children.length]));
    expect(counts).toEqual({
      vehicles: 4, property: 4, electronics: 5, "home-garden": 4, fashion: 3, "jobs-services": 4, agriculture: 3, "other-items": 0,
    });
  });

  it("uses unique, URL-safe slugs and bilingual names", () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of categories) {
      expect(c.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(c.name.en.trim()).not.toBe("");
      expect(c.name.fr.trim()).not.toBe("");
    }
  });

  it("requires review for job listings", () => {
    expect(bySlug("jobs").moderationLevel).toBe("review_required");
    expect(bySlug("cars").moderationLevel).toBe("standard");
  });

  it("resolves paths and descendants", () => {
    expect(categoryPath(categories, bySlug("cars")).map((c) => c.slug)).toEqual(["vehicles", "cars"]);
    expect(descendantIds(categories, "vehicles")).toEqual([
      "vehicles", "cars", "motorcycles", "commercial-vehicles", "vehicle-parts-accessories",
    ]);
  });

  it("gives each category the fields the brief asks for, with inheritance", () => {
    const keys = (slug: string) => effectiveAttributes(categories, bySlug(slug)).map((a) => a.key);
    expect(keys("cars")).toEqual(["make", "model", "year", "mileage_km", "fuel_type", "transmission"]);
    expect(keys("apartments-for-rent")).toEqual(["offer_type", "property_type", "rooms", "area_m2"]);
    expect(keys("mobile-phones")).toEqual(["brand", "model"]);
    expect(keys("vehicle-parts-accessories")).toEqual([]);
    expect(bySlug("mobile-phones").hasCondition).toBe(true);
    expect(bySlug("land").hasCondition).toBe(false);
  });
});

describe("category attribute validation", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const carSchema = attributesSchema(effectiveAttributes(categories, bySlug("cars")), now);

  it("accepts a valid vehicle", () => {
    const parsed = carSchema.safeParse({ make: "Toyota", model: "Corolla", year: 2015, fuel_type: "petrol", transmission: "automatic" });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing required fields, bad options, future years and unknown keys", () => {
    expect(carSchema.safeParse({ make: "Toyota", year: 2015 }).success).toBe(false);
    expect(carSchema.safeParse({ make: "Toyota", model: "X", year: 2015, fuel_type: "steam" }).success).toBe(false);
    expect(carSchema.safeParse({ make: "Toyota", model: "X", year: 2028 }).success).toBe(false);
    expect(carSchema.safeParse({ make: "Toyota", model: "X", year: 2015, owner_phone: "+237" }).success).toBe(false);
  });
});

describe("locations", () => {
  it("has the 10 regions of Cameroon and the 12 launch cities", () => {
    expect(referenceRegions()).toHaveLength(10);
    expect(referenceCities().map((c) => c.name.en)).toEqual([
      "Douala", "Yaoundé", "Bamenda", "Buea", "Limbe", "Bafoussam", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Kribi", "Kumba",
    ]);
  });

  it("assigns every city to a real region and never confuses regions with cities", () => {
    const regionSlugs = new Set(regionSeed.map((r) => r.slug));
    const citySlugs = new Set(citySeed.map((c) => c.slug));
    for (const city of citySeed) expect(regionSlugs.has(city.region)).toBe(true);
    for (const r of regionSlugs) expect(citySlugs.has(r)).toBe(false);
    const regionOf = Object.fromEntries(citySeed.map((c) => [c.slug, c.region]));
    expect(regionOf).toMatchObject({
      douala: "littoral", yaounde: "centre", bamenda: "north-west", buea: "south-west", limbe: "south-west",
      bafoussam: "west", garoua: "north", maroua: "far-north", ngaoundere: "adamawa", bertoua: "east",
      kribi: "south", kumba: "south-west",
    });
  });
});

describe("generated seed", () => {
  it("is up to date with the reference data (run `npm run db:seed:generate`)", () => {
    expect(readFileSync("supabase/seed.sql", "utf8")).toBe(buildSeedSql());
  });

  it("contains reference data only — no listings, users or activity", () => {
    const sql = buildSeedSql().toLowerCase();
    for (const table of ["listings", "profiles", "auth.users", "reports", "saved_listings"]) {
      expect(sql).not.toContain(`insert into public.${table} `);
      expect(sql).not.toContain(`insert into ${table} `);
    }
  });
});
