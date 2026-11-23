import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { interpolate } from "@/i18n/format";
import { localePath, routes } from "@/i18n/paths";
import { searchListings } from "@/lib/data/queries";
import { toSearchString, type SearchQuery } from "@/lib/search/params";
import { buttonClasses } from "@/components/ui/primitives";
import { EmptyState, ListingGrid } from "./ListingStates";

/** Database-backed, paginated results with shareable page links. */
export async function SearchResults({
  locale,
  dict,
  query,
  basePath,
  clearHref,
  empty,
}: {
  locale: Locale;
  dict: Dictionary;
  query: SearchQuery;
  /** Locale-independent path the pagination links point to. */
  basePath: string;
  clearHref?: string;
  /** Copy for the empty state; defaults to the "no match" message. */
  empty?: { title: string; body: string };
}) {
  const t = dict.search;
  const result = await searchListings(query);

  if (result.items.length === 0) {
    return (
      <EmptyState
        title={empty?.title ?? dict.listings.emptySearchTitle}
        body={empty?.body ?? dict.listings.emptySearchBody}
        action={
          clearHref ? (
            <Link href={clearHref} className={buttonClasses("secondary")}>
              {dict.listings.clearFilters}
            </Link>
          ) : null
        }
      />
    );
  }

  const pageHref = (page: number) =>
    `${localePath(locale, basePath)}${toSearchString({ ...query, category: basePath === routes.search ? query.category : undefined, page })}`;

  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-navy-500" aria-live="polite">
        {result.total === 1 ? t.resultCountOne : interpolate(t.resultCount, { count: result.total })}
      </p>
      <ListingGrid listings={result.items} locale={locale} dict={dict} />
      {result.pageCount > 1 ? (
        <nav aria-label={interpolate(t.pageOf, { page: result.page, total: result.pageCount })} className="mt-8 flex items-center justify-between gap-3">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} rel="prev" className={buttonClasses("secondary")}>
              {t.previous}
            </Link>
          ) : <span />}
          <span className="text-sm text-navy-500">{interpolate(t.pageOf, { page: result.page, total: result.pageCount })}</span>
          {result.page < result.pageCount ? (
            <Link href={pageHref(result.page + 1)} rel="next" className={buttonClasses("secondary")}>
              {t.next}
            </Link>
          ) : <span />}
        </nav>
      ) : null}
    </div>
  );
}
