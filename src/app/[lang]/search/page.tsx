import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { interpolate } from "@/i18n/format";
import { localized } from "@/i18n/localized";
import { localePath, routes } from "@/i18n/paths";
import { findCategoryBySlug } from "@/lib/data/category-tree";
import { getCatalog } from "@/lib/data/queries";
import { parseSearchParams } from "@/lib/search/params";
import { pageMetadata } from "@/lib/seo/metadata";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchResults } from "@/components/listings/SearchResults";
import { Container } from "@/components/ui/primitives";

/** Rendered per request; results are part of the response, never streamed separately. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  // Search result pages are crawlable via links but not indexed (thin/duplicate content).
  return pageMetadata({ locale, path: routes.search, title: dict.meta.searchTitle, index: false });
}

export default async function SearchPage({ searchParams }: PageProps<"/[lang]/search">) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <Container className="py-8 sm:py-10">
      <SearchBody locale={locale} dict={dict} searchParams={searchParams} />
    </Container>
  );
}

async function SearchBody({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[lang]/search">["searchParams"];
}) {
  const [{ query, invalid }, catalog] = await Promise.all([
    searchParams.then(parseSearchParams),
    getCatalog(),
  ]);
  const t = dict.search;
  const category = query.category ? findCategoryBySlug(catalog.categories, query.category) : undefined;
  const city = query.city ? catalog.cities.find((c) => c.slug === query.city) : undefined;

  const qualifiers = [
    category ? interpolate(t.inCategory, { category: localized(category.name, locale) }) : null,
    city ? interpolate(t.inCity, { city: localized(city.name, locale) }) : null,
  ].filter(Boolean);
  const heading = query.q ? interpolate(t.resultsFor, { query: query.q }) : t.resultsTitle;

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
        {heading}
        {qualifiers.length ? <span className="text-navy-500"> {qualifiers.join(" ")}</span> : null}
      </h1>
      <div className="mt-5">
        <SearchForm
          variant="hero"
          locale={locale}
          dict={dict}
          categories={catalog.categories}
          cities={catalog.cities}
          regions={catalog.regions}
          defaults={{ q: query.q, city: query.city, category: query.category }}
        />
      </div>
      {invalid.length > 0 ? (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-orange-700">
          <TriangleAlert aria-hidden="true" className="size-4" />
          {t.invalidQuery}
        </p>
      ) : null}
      <div className="mt-8">
        <SearchResults
          locale={locale}
          dict={dict}
          query={query}
          basePath={routes.search}
          clearHref={localePath(locale, routes.search)}
        />
      </div>
    </>
  );
}
