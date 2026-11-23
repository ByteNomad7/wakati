import type {
  AttributeDataType,
  Category,
  CategoryIcon,
  City,
  ListingCondition,
  ListingSummary,
  ModerationLevel,
  Region,
  SellerType,
} from "./types";

/** Row shapes returned by PostgREST (snake_case, as in the SQL schema). */
export interface CategoryAttributeRow {
  key: string;
  data_type: AttributeDataType;
  label_en: string;
  label_fr: string;
  options: { value: string; label_en: string; label_fr: string }[] | null;
  is_required: boolean;
  is_filterable: boolean;
  min_value: number | string | null;
  max_value: number | string | null;
  unit: string | null;
  sort_order: number;
}

export interface CategoryRow {
  id: string;
  parent_id: string | null;
  slug: string;
  name_en: string;
  name_fr: string;
  icon: string | null;
  sort_order: number;
  has_condition: boolean;
  moderation_level: ModerationLevel;
  category_attributes?: CategoryAttributeRow[] | null;
}

export interface RegionRow {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  sort_order: number;
}

export interface CityRow {
  id: string;
  region_id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  is_featured: boolean;
  sort_order: number;
}

export interface ListingCardRow {
  id: string;
  slug: string;
  title: string;
  price_xaf: number | string | null;
  is_negotiable: boolean;
  condition: ListingCondition | null;
  category_id: string;
  city_slug: string;
  city_name_en: string;
  city_name_fr: string;
  neighbourhood_name: string | null;
  cover_image_path: string | null;
  published_at: string;
  seller_type: SellerType;
}

const knownIcons: readonly CategoryIcon[] = [
  "vehicles", "property", "electronics", "home-garden", "fashion", "jobs-services", "agriculture", "other",
];

const toNumber = (v: number | string | null): number | undefined =>
  v === null || v === undefined ? undefined : Number(v);

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    parentId: row.parent_id,
    name: { en: row.name_en, fr: row.name_fr },
    icon: knownIcons.includes(row.icon as CategoryIcon) ? (row.icon as CategoryIcon) : null,
    sortOrder: row.sort_order,
    hasCondition: row.has_condition,
    moderationLevel: row.moderation_level,
    attributes: (row.category_attributes ?? [])
      .map((a) => ({
        key: a.key,
        dataType: a.data_type,
        label: { en: a.label_en, fr: a.label_fr },
        required: a.is_required,
        filterable: a.is_filterable,
        options: a.options?.map((o) => ({ value: o.value, label: { en: o.label_en, fr: o.label_fr } })),
        min: toNumber(a.min_value),
        max: toNumber(a.max_value),
        unit: a.unit ?? undefined,
        sortOrder: a.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function mapRegionRow(row: RegionRow): Region {
  return { id: row.id, slug: row.slug, name: { en: row.name_en, fr: row.name_fr }, sortOrder: row.sort_order };
}

export function mapCityRow(row: CityRow): City {
  return {
    id: row.id,
    slug: row.slug,
    regionId: row.region_id,
    name: { en: row.name_en, fr: row.name_fr },
    featured: row.is_featured,
    sortOrder: row.sort_order,
  };
}

export function mapListingCardRow(
  row: ListingCardRow,
  imageUrl: (path: string | null) => string | null,
): ListingSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    // bigint can arrive as a string from PostgREST
    priceXaf: row.price_xaf === null ? null : Number(row.price_xaf),
    isNegotiable: row.is_negotiable,
    condition: row.condition,
    categoryId: row.category_id,
    citySlug: row.city_slug,
    cityName: { en: row.city_name_en, fr: row.city_name_fr },
    neighbourhoodName: row.neighbourhood_name,
    coverImageUrl: imageUrl(row.cover_image_path),
    publishedAt: row.published_at,
    sellerType: row.seller_type,
  };
}
