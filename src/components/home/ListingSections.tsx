import { Plus } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localePath, routes } from "@/i18n/paths";
import { getFeaturedListings, getLatestListings } from "@/lib/data/queries";
import { showLayoutPlaceholders } from "@/lib/env";
import { EmptyState, LayoutPlaceholders, ListingGrid } from "@/components/listings/ListingStates";
import { ButtonLink, Container, SectionHeading } from "@/components/ui/primitives";
import Link from "next/link";

/* B. Latest listings: real published listings, or an honest empty state. */
export async function LatestListings({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const listings = await getLatestListings(8);
  return (
    <section aria-labelledby="latest-listings" className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          id="latest-listings"
          title={dict.home.latestListings}
          lead={dict.home.latestListingsLead}
          action={
            listings.length > 0 ? (
              <Link href={localePath(locale, routes.search)} className="min-h-11 content-center font-bold text-orange-700 hover:underline">
                {dict.home.viewAll}
              </Link>
            ) : null
          }
        />
        {listings.length > 0 ? (
          <ListingGrid listings={listings} locale={locale} dict={dict} />
        ) : showLayoutPlaceholders() ? (
          <LayoutPlaceholders dict={dict} />
        ) : (
          <EmptyState
            title={dict.listings.emptyTitle}
            body={dict.listings.emptyBody}
            action={
              <ButtonLink href={localePath(locale, routes.postAd)}>
                <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
                {dict.nav.postAd}
              </ButtonLink>
            }
          />
        )}
      </Container>
    </section>
  );
}

/* C. Featured listings: rendered only when genuine staff-featured listings exist. */
export async function FeaturedListings({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const listings = await getFeaturedListings(4);
  if (listings.length === 0) return null;
  return (
    <section aria-labelledby="featured-listings" className="bg-white py-12 sm:py-16">
      <Container>
        <SectionHeading id="featured-listings" title={dict.home.featuredListings} />
        <ListingGrid listings={listings} locale={locale} dict={dict} />
      </Container>
    </section>
  );
}
