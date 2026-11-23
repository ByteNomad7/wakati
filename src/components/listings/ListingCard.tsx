import Image from "next/image";
import { ImageOff, MapPin } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatDate, formatPrice, interpolate } from "@/i18n/format";
import { localized } from "@/i18n/localized";
import type { ListingSummary } from "@/lib/data/types";

/**
 * Card for a real, published listing. Listing detail pages arrive in Phase B,
 * so the card is not yet a link; it becomes one when /l/[slug] exists.
 */
export function ListingCard({
  listing,
  locale,
  dict,
}: {
  listing: ListingSummary;
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.listings;
  const place = [listing.neighbourhoodName, localized(listing.cityName, locale)].filter(Boolean).join(", ");
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-navy-100">
      <div className="relative aspect-[4/3] bg-navy-50">
        {listing.coverImageUrl ? (
          <Image
            src={listing.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-navy-300">
            <ImageOff aria-hidden="true" className="size-7" />
            <span className="text-xs font-semibold">{t.noImage}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="text-lg font-extrabold text-navy-900">
          {listing.priceXaf !== null ? formatPrice(listing.priceXaf, locale) : "—"}
          {listing.isNegotiable ? (
            <span className="ml-2 align-middle text-xs font-bold text-orange-700">{t.negotiable}</span>
          ) : null}
        </p>
        {/* User content is shown in the language it was written in. */}
        <h3 className="line-clamp-2 text-sm font-semibold text-navy-800">{listing.title}</h3>
        <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-navy-500">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{place}</span>
        </p>
        <p className="text-xs text-navy-500">
          {interpolate(t.postedOn, { date: formatDate(listing.publishedAt, locale) })}
        </p>
      </div>
    </article>
  );
}
