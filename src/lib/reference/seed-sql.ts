import { categorySeed } from "./categories";
import { citySeed, regionSeed } from "./locations";
import type { CategoryAttribute } from "@/lib/data/types";

const lit = (value: string | null | undefined) =>
  value === null || value === undefined ? "null" : `'${value.replace(/'/g, "''")}'`;
const num = (value: number | undefined) => (value === undefined ? "null" : String(value));

function attributeRows(categorySlug: string, attributes: CategoryAttribute[]): string[] {
  return attributes.map((a) => {
    const options = a.options
      ? lit(JSON.stringify(a.options.map((o) => ({ value: o.value, label_en: o.label.en, label_fr: o.label.fr })))) + "::jsonb"
      : "null";
    return `((select id from public.categories where slug = ${lit(categorySlug)}), ${lit(a.key)}, ${lit(a.dataType)}, ${lit(a.label.en)}, ${lit(a.label.fr)}, ${options}, ${a.required}, ${a.filterable}, ${num(a.min)}, ${num(a.max)}, ${lit(a.unit)}, ${a.sortOrder})`;
  });
}

/** Builds the full idempotent seed script for reference data. */
export function buildSeedSql(): string {
  const lines: string[] = [
    "-- =============================================================================",
    "-- Wakati reference data seed (GENERATED – do not edit by hand)",
    "-- Source: src/lib/reference/*.ts  ·  Regenerate: npm run db:seed:generate",
    "-- Contains categories, regions and cities only. No listings, users or activity.",
    "-- =============================================================================",
    "",
    "begin;",
    "",
    "-- Regions",
    "insert into public.regions (slug, name_en, name_fr, sort_order) values",
    regionSeed.map((r, i) => `  (${lit(r.slug)}, ${lit(r.en)}, ${lit(r.fr)}, ${(i + 1) * 10})`).join(",\n"),
    "on conflict (slug) do update set name_en = excluded.name_en, name_fr = excluded.name_fr, sort_order = excluded.sort_order;",
    "",
    "-- Cities (each belongs to one region)",
    "insert into public.cities (region_id, slug, name_en, name_fr, is_featured, sort_order) values",
    citySeed
      .map(
        (c, i) =>
          `  ((select id from public.regions where slug = ${lit(c.region)}), ${lit(c.slug)}, ${lit(c.name)}, ${lit(c.name)}, true, ${(i + 1) * 10})`,
      )
      .join(",\n"),
    "on conflict (slug) do update set region_id = excluded.region_id, name_en = excluded.name_en, name_fr = excluded.name_fr, is_featured = excluded.is_featured, sort_order = excluded.sort_order;",
    "",
    "-- Top-level categories",
    "insert into public.categories (slug, name_en, name_fr, icon, sort_order, has_condition, moderation_level) values",
    categorySeed
      .map(
        (c, i) =>
          `  (${lit(c.slug)}, ${lit(c.name.en)}, ${lit(c.name.fr)}, ${lit(c.icon)}, ${(i + 1) * 10}, ${c.hasCondition}, ${lit(c.moderationLevel ?? "standard")})`,
      )
      .join(",\n"),
    "on conflict (slug) do update set parent_id = null, name_en = excluded.name_en, name_fr = excluded.name_fr, icon = excluded.icon, sort_order = excluded.sort_order, has_condition = excluded.has_condition, moderation_level = excluded.moderation_level;",
    "",
  ];

  const children = categorySeed.flatMap((parent) =>
    (parent.children ?? []).map((child, j) => ({ parent, child, sort: (j + 1) * 10 })),
  );
  lines.push(
    "-- Subcategories",
    "insert into public.categories (parent_id, slug, name_en, name_fr, sort_order, has_condition, moderation_level) values",
    children
      .map(
        ({ parent, child, sort }) =>
          `  ((select id from public.categories where slug = ${lit(parent.slug)}), ${lit(child.slug)}, ${lit(child.name.en)}, ${lit(child.name.fr)}, ${sort}, ${child.hasCondition}, ${lit(child.moderationLevel ?? "standard")})`,
      )
      .join(",\n"),
    "on conflict (slug) do update set parent_id = excluded.parent_id, name_en = excluded.name_en, name_fr = excluded.name_fr, sort_order = excluded.sort_order, has_condition = excluded.has_condition, moderation_level = excluded.moderation_level;",
    "",
  );

  const attrRows = [
    ...categorySeed.flatMap((c) => attributeRows(c.slug, c.attributes ?? [])),
    ...children.flatMap(({ child }) => attributeRows(child.slug, child.attributes ?? [])),
  ];
  lines.push(
    "-- Category-specific listing fields",
    "insert into public.category_attributes (category_id, key, data_type, label_en, label_fr, options, is_required, is_filterable, min_value, max_value, unit, sort_order) values",
    attrRows.map((r) => `  ${r}`).join(",\n"),
    "on conflict (category_id, key) do update set data_type = excluded.data_type, label_en = excluded.label_en, label_fr = excluded.label_fr, options = excluded.options, is_required = excluded.is_required, is_filterable = excluded.is_filterable, min_value = excluded.min_value, max_value = excluded.max_value, unit = excluded.unit, sort_order = excluded.sort_order;",
    "",
    "commit;",
    "",
  );

  return lines.join("\n");
}
