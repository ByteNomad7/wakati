import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { ListingSummary } from "@/lib/data/types";
import { ListingCard } from "./ListingCard";

export function ListingGrid({
  listings,
  locale,
  dict,
}: {
  listings: ListingSummary[];
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} locale={locale} dict={dict} />
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-navy-300 bg-white px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-700">
        <PackageOpen aria-hidden="true" className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-navy-900">{title}</h3>
      <p className="mt-1 max-w-md text-navy-500">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ListingGridSkeleton({ count = 4, label }: { count?: number; label: string }) {
  return (
    <div role="status" aria-label={label}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-navy-100">
            <div className="aspect-[4/3] animate-pulse bg-navy-50" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-navy-50" />
              <div className="h-4 w-full animate-pulse rounded bg-navy-50" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-navy-50" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Development-only layout preview (NEXT_PUBLIC_SHOW_LAYOUT_PLACEHOLDERS=true, never in
 * production). Deliberately contains no prices, titles or sellers so it cannot be
 * mistaken for marketplace activity.
 */
export function LayoutPlaceholders({ dict, count = 4 }: { dict: Dictionary; count?: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed border-orange-500/60 p-3">
      <p className="mb-3 text-xs font-bold text-orange-700">{dict.listings.placeholderNote}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-navy-100">
            <div className="flex aspect-[4/3] items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-navy-50),var(--color-navy-50)_10px,white_10px,white_20px)]">
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-navy-900">
                {dict.listings.placeholderBadge}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <div className="h-5 w-1/2 rounded bg-navy-100" />
              <div className="h-4 w-full rounded bg-navy-50" />
              <div className="h-3 w-1/3 rounded bg-navy-50" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
