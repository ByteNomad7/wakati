/**
 * Domain types shared by the UI, the data repositories and (later) the mobile app.
 * They mirror the PostgreSQL schema in supabase/migrations.
 */

export type LocalizedText = { en: string; fr: string };

export type ModerationLevel = "standard" | "review_required";

export type CategoryIcon =
  | "vehicles"
  | "property"
  | "electronics"
  | "home-garden"
  | "fashion"
  | "jobs-services"
  | "agriculture"
  | "other";

export type AttributeDataType = "text" | "integer" | "decimal" | "year" | "select" | "boolean";

export interface AttributeOption {
  value: string;
  label: LocalizedText;
}

/** Definition of a category-specific listing field (stored in `category_attributes`). */
export interface CategoryAttribute {
  key: string;
  dataType: AttributeDataType;
  label: LocalizedText;
  required: boolean;
  filterable: boolean;
  options?: AttributeOption[];
  min?: number;
  max?: number;
  unit?: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  slug: string;
  parentId: string | null;
  name: LocalizedText;
  icon: CategoryIcon | null;
  sortOrder: number;
  /** Whether the "condition" field applies to listings in this category. */
  hasCondition: boolean;
  moderationLevel: ModerationLevel;
  /** Fields defined directly on this category (descendants inherit them). */
  attributes: CategoryAttribute[];
}

export interface CategoryNode extends Category {
  children: Category[];
}

export interface Region {
  id: string;
  slug: string;
  name: LocalizedText;
  sortOrder: number;
}

export interface City {
  id: string;
  slug: string;
  regionId: string;
  name: LocalizedText;
  /** Shown in "Browse by city" on the homepage. */
  featured: boolean;
  sortOrder: number;
}

export interface Neighbourhood {
  id: string;
  slug: string;
  cityId: string;
  name: string;
}

export const listingConditions = ["new", "like_new", "good", "fair", "for_parts"] as const;
export type ListingCondition = (typeof listingConditions)[number];

export type SellerType = "private" | "business";

/** Public, privacy-safe projection of a listing used in cards and search results. */
export interface ListingSummary {
  id: string;
  slug: string;
  title: string;
  priceXaf: number | null;
  isNegotiable: boolean;
  condition: ListingCondition | null;
  categoryId: string;
  citySlug: string;
  cityName: LocalizedText;
  neighbourhoodName: string | null;
  coverImageUrl: string | null;
  publishedAt: string;
  sellerType: SellerType;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type DataSource = "database" | "reference";
