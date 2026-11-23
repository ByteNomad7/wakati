import type { City, Region } from "@/lib/data/types";

/**
 * Cameroon location seed (brief §6). Regions and cities are separate entities:
 * a city always belongs to exactly one of the 10 regions.
 *
 * Neighbourhoods are intentionally not seeded yet: the `neighbourhoods` table exists
 * so that a verified list can be loaded per city before sellers can pick one.
 * In reference mode the slug doubles as the id.
 */

export const regionSeed: ReadonlyArray<{ slug: string; en: string; fr: string }> = [
  { slug: "adamawa", en: "Adamawa", fr: "Adamaoua" },
  { slug: "centre", en: "Centre", fr: "Centre" },
  { slug: "east", en: "East", fr: "Est" },
  { slug: "far-north", en: "Far North", fr: "Extrême-Nord" },
  { slug: "littoral", en: "Littoral", fr: "Littoral" },
  { slug: "north", en: "North", fr: "Nord" },
  { slug: "north-west", en: "North-West", fr: "Nord-Ouest" },
  { slug: "west", en: "West", fr: "Ouest" },
  { slug: "south", en: "South", fr: "Sud" },
  { slug: "south-west", en: "South-West", fr: "Sud-Ouest" },
];

/** Launch cities, in the order given in the brief. */
export const citySeed: ReadonlyArray<{ slug: string; name: string; region: string }> = [
  { slug: "douala", name: "Douala", region: "littoral" },
  { slug: "yaounde", name: "Yaoundé", region: "centre" },
  { slug: "bamenda", name: "Bamenda", region: "north-west" },
  { slug: "buea", name: "Buea", region: "south-west" },
  { slug: "limbe", name: "Limbe", region: "south-west" },
  { slug: "bafoussam", name: "Bafoussam", region: "west" },
  { slug: "garoua", name: "Garoua", region: "north" },
  { slug: "maroua", name: "Maroua", region: "far-north" },
  { slug: "ngaoundere", name: "Ngaoundéré", region: "adamawa" },
  { slug: "bertoua", name: "Bertoua", region: "east" },
  { slug: "kribi", name: "Kribi", region: "south" },
  { slug: "kumba", name: "Kumba", region: "south-west" },
];

export function referenceRegions(): Region[] {
  return regionSeed.map((r, i) => ({
    id: r.slug,
    slug: r.slug,
    name: { en: r.en, fr: r.fr },
    sortOrder: (i + 1) * 10,
  }));
}

export function referenceCities(): City[] {
  return citySeed.map((c, i) => ({
    id: c.slug,
    slug: c.slug,
    regionId: c.region,
    name: { en: c.name, fr: c.name },
    featured: true,
    sortOrder: (i + 1) * 10,
  }));
}
