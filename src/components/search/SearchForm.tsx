import { MapPin, Search, LayoutGrid } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localized } from "@/i18n/localized";
import { localePath, routes } from "@/i18n/paths";
import { buildCategoryTree } from "@/lib/data/category-tree";
import type { Category, City, Region } from "@/lib/data/types";
import { cx } from "@/components/ui/primitives";

interface Props {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  cities: City[];
  regions: Region[];
  variant: "hero" | "header";
  defaults?: { q?: string; city?: string; category?: string };
  id?: string;
}

/**
 * Plain GET form: works without JavaScript and produces clean, shareable URLs
 * such as /fr/search?q=toyota&city=douala&category=cars.
 */
export function SearchForm({ locale, dict, categories, cities, regions, variant, defaults, id = "search" }: Props) {
  const t = dict.search;
  const tree = buildCategoryTree(categories);
  const citiesByRegion = regions
    .map((region) => ({ region, cities: cities.filter((c) => c.regionId === region.id) }))
    .filter((group) => group.cities.length > 0);

  const field =
    "w-full min-h-12 bg-transparent text-[15px] font-medium text-navy-900 placeholder:text-navy-500 focus:outline-none";

  const citySelect = (
    <label className="relative flex items-center gap-2 px-3">
      <MapPin aria-hidden="true" className="size-5 shrink-0 text-orange-700" />
      <span className="sr-only">{t.city}</span>
      <select name="city" defaultValue={defaults?.city ?? ""} className={cx(field, "cursor-pointer appearance-none pr-2")}>
        <option value="">{t.allCities}</option>
        {citiesByRegion.map(({ region, cities: list }) => (
          <optgroup key={region.id} label={dict.cities.regionLabel.replace("{region}", localized(region.name, locale))}>
            {list.map((c) => (
              <option key={c.id} value={c.slug}>
                {localized(c.name, locale)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );

  if (variant === "header") {
    return (
      <form
        role="search"
        aria-label={t.label}
        action={localePath(locale, routes.search)}
        method="get"
        className="flex w-full items-stretch rounded-[var(--radius-control)] bg-white ring-1 ring-navy-100 focus-within:ring-2 focus-within:ring-orange-500"
      >
        <label className="flex flex-1 items-center gap-2 pl-3">
          <Search aria-hidden="true" className="size-5 shrink-0 text-navy-500" />
          <span className="sr-only">{t.keyword}</span>
          <input
            type="search"
            name="q"
            defaultValue={defaults?.q}
            maxLength={100}
            placeholder={t.placeholder}
            className={field}
            enterKeyHint="search"
          />
        </label>
        <div className="hidden w-44 shrink-0 border-l border-navy-100 2xl:block">{citySelect}</div>
        <button
          type="submit"
          className="m-1 rounded-[calc(var(--radius-control)-4px)] bg-navy-900 px-4 text-sm font-bold text-white hover:bg-navy-800"
        >
          {t.submit}
        </button>
      </form>
    );
  }

  return (
    <form
      id={id}
      role="search"
      aria-label={t.label}
      action={localePath(locale, routes.search)}
      method="get"
      className="grid gap-2 rounded-[var(--radius-card)] bg-white p-2 shadow-[var(--shadow-raised)] md:grid-cols-[1.6fr_1fr_1fr_auto] md:gap-0 md:divide-x md:divide-navy-100"
    >
      <label className="flex items-center gap-2 rounded-[var(--radius-control)] px-3 ring-1 ring-navy-100 md:ring-0">
        <Search aria-hidden="true" className="size-5 shrink-0 text-navy-500" />
        <span className="sr-only">{t.keyword}</span>
        <input
          type="search"
          name="q"
          defaultValue={defaults?.q}
          maxLength={100}
          placeholder={t.placeholder}
          className={field}
          enterKeyHint="search"
        />
      </label>
      <div className="rounded-[var(--radius-control)] ring-1 ring-navy-100 md:ring-0">{citySelect}</div>
      <label className="flex items-center gap-2 rounded-[var(--radius-control)] px-3 ring-1 ring-navy-100 md:ring-0">
        <LayoutGrid aria-hidden="true" className="size-5 shrink-0 text-orange-700" />
        <span className="sr-only">{t.category}</span>
        <select
          name="category"
          defaultValue={defaults?.category ?? ""}
          className={cx(field, "cursor-pointer appearance-none")}
        >
          <option value="">{t.allCategories}</option>
          {tree.map((top) =>
            top.children.length === 0 ? (
              <option key={top.id} value={top.slug}>
                {localized(top.name, locale)}
              </option>
            ) : (
              <optgroup key={top.id} label={localized(top.name, locale)}>
                <option value={top.slug}>
                  {t.allInCategory.replace("{category}", localized(top.name, locale))}
                </option>
                {top.children.map((child) => (
                  <option key={child.id} value={child.slug}>
                    {localized(child.name, locale)}
                  </option>
                ))}
              </optgroup>
            ),
          )}
        </select>
      </label>
      <div className="md:pl-2">
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-orange-500 px-6 text-base font-extrabold text-navy-900 hover:bg-orange-600"
        >
          <Search aria-hidden="true" className="size-5" />
          {t.submit}
        </button>
      </div>
    </form>
  );
}
