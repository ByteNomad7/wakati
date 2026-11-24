import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/server";
import { localePath, routes } from "@/i18n/paths";
import { getCatalog } from "@/lib/data/queries";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo/metadata";
import { Hero } from "@/components/home/Hero";
import { BrowseByCity, HowItWorks, PopularCategories, PostAdCta, SafetyTips } from "@/components/home/Sections";
import { FeaturedListings, LatestListings } from "@/components/home/ListingSections";

/** Rendered per request so the latest listings are always current (no stale cache). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return {
    ...pageMetadata({ locale, path: "/", title: dict.meta.homeTitle, description: dict.meta.homeDescription }),
    title: { absolute: dict.meta.homeTitle },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const [dict, catalog] = await Promise.all([getDictionary(locale), getCatalog()]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Wakati",
    url: absoluteUrl(localePath(locale)),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl(localePath(locale, routes.search))}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <Hero locale={locale} dict={dict} categories={catalog.categories} cities={catalog.cities} regions={catalog.regions} />
      <PopularCategories locale={locale} dict={dict} categories={catalog.categories} />
      <LatestListings locale={locale} dict={dict} />
      <FeaturedListings locale={locale} dict={dict} />
      <BrowseByCity locale={locale} dict={dict} cities={catalog.cities} regions={catalog.regions} />
      <HowItWorks dict={dict} />
      <SafetyTips locale={locale} dict={dict} />
      <PostAdCta locale={locale} dict={dict} />
    </>
  );
}
