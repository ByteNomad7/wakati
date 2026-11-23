import type {
  AttributeOption,
  Category,
  CategoryAttribute,
  CategoryIcon,
  LocalizedText,
  ModerationLevel,
} from "@/lib/data/types";

/**
 * Launch category tree (brief §5).
 *
 * This is SEED data: it is written to supabase/seed.sql by `npm run db:seed:generate`
 * and is used as a read-only fallback when no database is configured. In production
 * the `categories` and `category_attributes` tables are the source of truth, so new
 * categories and fields are added in the database, not by adding pages or code.
 */

const opt = (value: string, en: string, fr: string): AttributeOption => ({
  value,
  label: { en, fr },
});

// "year" fields have no stored maximum; validation caps them at next year at runtime.
const vehicleAttributes: CategoryAttribute[] = [
  { key: "make", dataType: "text", label: { en: "Make", fr: "Marque" }, required: true, filterable: true, sortOrder: 10 },
  { key: "model", dataType: "text", label: { en: "Model", fr: "Modèle" }, required: true, filterable: true, sortOrder: 20 },
  { key: "year", dataType: "year", label: { en: "Year", fr: "Année" }, required: true, filterable: true, min: 1950, sortOrder: 30 },
  { key: "mileage_km", dataType: "integer", label: { en: "Mileage", fr: "Kilométrage" }, required: false, filterable: true, min: 0, max: 2_000_000, unit: "km", sortOrder: 40 },
  {
    key: "fuel_type", dataType: "select", label: { en: "Fuel type", fr: "Carburant" }, required: false, filterable: true, sortOrder: 50,
    options: [
      opt("petrol", "Petrol", "Essence"),
      opt("diesel", "Diesel", "Diesel"),
      opt("hybrid", "Hybrid", "Hybride"),
      opt("electric", "Electric", "Électrique"),
      opt("lpg", "LPG", "GPL"),
      opt("other", "Other", "Autre"),
    ],
  },
  {
    key: "transmission", dataType: "select", label: { en: "Transmission", fr: "Boîte de vitesses" }, required: false, filterable: true, sortOrder: 60,
    options: [opt("manual", "Manual", "Manuelle"), opt("automatic", "Automatic", "Automatique")],
  },
];

const propertyAttributes: CategoryAttribute[] = [
  {
    key: "offer_type", dataType: "select", label: { en: "Rent or sale", fr: "Location ou vente" }, required: true, filterable: true, sortOrder: 10,
    options: [opt("rent", "For rent", "À louer"), opt("sale", "For sale", "À vendre")],
  },
  {
    key: "property_type", dataType: "select", label: { en: "Property type", fr: "Type de bien" }, required: true, filterable: true, sortOrder: 20,
    options: [
      opt("house", "House", "Maison"),
      opt("apartment", "Apartment", "Appartement"),
      opt("studio", "Studio", "Studio"),
      opt("room", "Room", "Chambre"),
      opt("land", "Land", "Terrain"),
      opt("office", "Office", "Bureau"),
      opt("shop", "Shop", "Boutique"),
      opt("warehouse", "Warehouse", "Entrepôt"),
    ],
  },
  { key: "rooms", dataType: "integer", label: { en: "Number of rooms", fr: "Nombre de pièces" }, required: false, filterable: true, min: 0, max: 100, sortOrder: 30 },
  { key: "area_m2", dataType: "decimal", label: { en: "Area", fr: "Surface" }, required: false, filterable: true, min: 1, max: 10_000_000, unit: "m²", sortOrder: 40 },
];

const electronicsAttributes: CategoryAttribute[] = [
  { key: "brand", dataType: "text", label: { en: "Brand", fr: "Marque" }, required: false, filterable: true, sortOrder: 10 },
  { key: "model", dataType: "text", label: { en: "Model", fr: "Modèle" }, required: false, filterable: false, sortOrder: 20 },
];

interface SeedCategory {
  slug: string;
  name: LocalizedText;
  icon?: CategoryIcon;
  hasCondition: boolean;
  moderationLevel?: ModerationLevel;
  attributes?: CategoryAttribute[];
  children?: SeedCategory[];
}

const leaf = (
  slug: string,
  en: string,
  fr: string,
  hasCondition: boolean,
  extra: Partial<SeedCategory> = {},
): SeedCategory => ({ slug, name: { en, fr }, hasCondition, ...extra });

export const categorySeed: SeedCategory[] = [
  {
    slug: "vehicles", name: { en: "Vehicles", fr: "Véhicules" }, icon: "vehicles", hasCondition: true,
    children: [
      leaf("cars", "Cars", "Voitures", true, { attributes: vehicleAttributes }),
      leaf("motorcycles", "Motorcycles", "Motos", true, { attributes: vehicleAttributes }),
      leaf("commercial-vehicles", "Commercial Vehicles", "Véhicules utilitaires", true, { attributes: vehicleAttributes }),
      leaf("vehicle-parts-accessories", "Spare Parts & Accessories", "Pièces détachées et accessoires", true),
    ],
  },
  {
    slug: "property", name: { en: "Property", fr: "Immobilier" }, icon: "property", hasCondition: false,
    attributes: propertyAttributes,
    children: [
      leaf("houses-for-sale", "Houses for Sale", "Maisons à vendre", false),
      leaf("apartments-for-rent", "Apartments for Rent", "Appartements à louer", false),
      leaf("land", "Land", "Terrains", false),
      leaf("commercial-property", "Commercial Property", "Locaux commerciaux", false),
    ],
  },
  {
    slug: "electronics", name: { en: "Electronics", fr: "Électronique" }, icon: "electronics", hasCondition: true,
    attributes: electronicsAttributes,
    children: [
      leaf("mobile-phones", "Mobile Phones", "Téléphones mobiles", true),
      leaf("computers", "Computers", "Ordinateurs", true),
      leaf("tvs", "TVs", "Téléviseurs", true),
      leaf("gaming", "Gaming", "Jeux vidéo", true),
      leaf("electronics-accessories", "Accessories", "Accessoires", true),
    ],
  },
  {
    slug: "home-garden", name: { en: "Home & Garden", fr: "Maison et jardin" }, icon: "home-garden", hasCondition: true,
    children: [
      leaf("furniture", "Furniture", "Meubles", true),
      leaf("appliances", "Appliances", "Électroménager", true),
      leaf("home-improvement", "Home Improvement", "Bricolage et rénovation", true),
      leaf("garden-equipment", "Garden Equipment", "Équipement de jardin", true),
    ],
  },
  {
    slug: "fashion", name: { en: "Fashion", fr: "Mode" }, icon: "fashion", hasCondition: true,
    children: [
      leaf("clothing", "Clothing", "Vêtements", true),
      leaf("shoes", "Shoes", "Chaussures", true),
      leaf("watches-accessories", "Watches & Accessories", "Montres et accessoires", true),
    ],
  },
  {
    slug: "jobs-services", name: { en: "Jobs & Services", fr: "Emplois et services" }, icon: "jobs-services", hasCondition: false,
    children: [
      // Job ads are a common fraud vector; they are reviewed before publication.
      leaf("jobs", "Jobs", "Emplois", false, { moderationLevel: "review_required" }),
      leaf("skilled-services", "Skilled Services", "Services qualifiés", false),
      leaf("repairs", "Repairs", "Réparations", false),
      leaf("business-services", "Business Services", "Services aux entreprises", false),
    ],
  },
  {
    slug: "agriculture", name: { en: "Agriculture", fr: "Agriculture" }, icon: "agriculture", hasCondition: false,
    children: [
      leaf("farm-equipment", "Farm Equipment", "Matériel agricole", true),
      leaf("farming-supplies", "Farming Supplies", "Fournitures agricoles", false),
      leaf("agricultural-produce", "Agricultural Produce", "Produits agricoles", false),
    ],
  },
  { slug: "other-items", name: { en: "Other Items", fr: "Autres articles" }, icon: "other", hasCondition: true },
];

/** Flattened categories in display order; in reference mode the slug doubles as the id. */
export function referenceCategories(): Category[] {
  const out: Category[] = [];
  categorySeed.forEach((top, i) => {
    out.push(toCategory(top, null, (i + 1) * 10));
    top.children?.forEach((child, j) => out.push(toCategory(child, top.slug, (j + 1) * 10)));
  });
  return out;
}

function toCategory(seed: SeedCategory, parentId: string | null, sortOrder: number): Category {
  return {
    id: seed.slug,
    slug: seed.slug,
    parentId,
    name: seed.name,
    icon: seed.icon ?? null,
    sortOrder,
    hasCondition: seed.hasCondition,
    moderationLevel: seed.moderationLevel ?? "standard",
    attributes: seed.attributes ?? [],
  };
}
