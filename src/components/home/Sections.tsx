import Link from "next/link";
import { ArrowRight, Handshake, MapPin, MessageCircle, PenLine, Plus, ShieldCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { interpolate } from "@/i18n/format";
import { localized } from "@/i18n/localized";
import { localePath, routes } from "@/i18n/paths";
import { buildCategoryTree } from "@/lib/data/category-tree";
import type { Category, City, Region } from "@/lib/data/types";
import { toSearchString } from "@/lib/search/params";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ButtonLink, Container, SectionHeading } from "@/components/ui/primitives";

/* A. Popular categories ---------------------------------------------------- */
export function PopularCategories({
  locale,
  dict,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
}) {
  const tree = buildCategoryTree(categories);
  return (
    <section aria-labelledby="popular-categories" className="py-12 sm:py-16">
      <Container>
        <SectionHeading id="popular-categories" title={dict.home.popularCategories} lead={dict.home.popularCategoriesLead} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {tree.map((c) => (
            <li key={c.id}>
              <Link
                href={localePath(locale, routes.category(c.slug))}
                className="group flex h-full flex-col gap-3 rounded-[var(--radius-card)] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-navy-100 transition hover:-translate-y-0.5 hover:ring-orange-500 sm:p-5"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-navy-900 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-navy-900">
                  <CategoryIcon icon={c.icon} className="size-6" />
                </span>
                <span>
                  <span className="block text-base font-extrabold text-navy-900">{localized(c.name, locale)}</span>
                  {c.children.length > 0 ? (
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-navy-500">
                      {c.children.map((child) => localized(child.name, locale)).join(" · ")}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* D. Browse by city -------------------------------------------------------- */
export function BrowseByCity({
  locale,
  dict,
  cities,
  regions,
}: {
  locale: Locale;
  dict: Dictionary;
  cities: City[];
  regions: Region[];
}) {
  const regionName = (id: string) => {
    const region = regions.find((r) => r.id === id);
    return region ? interpolate(dict.cities.regionLabel, { region: localized(region.name, locale) }) : "";
  };
  return (
    <section aria-labelledby="browse-by-city" className="py-12 sm:py-16">
      <Container>
        <SectionHeading id="browse-by-city" title={dict.home.browseByCity} lead={dict.home.browseByCityLead} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cities
            .filter((c) => c.featured)
            .map((city) => (
              <li key={city.id}>
                <Link
                  href={`${localePath(locale, routes.search)}${toSearchString({ city: city.slug })}`}
                  className="flex min-h-16 items-center gap-3 rounded-[var(--radius-card)] bg-white px-4 py-3 ring-1 ring-navy-100 transition hover:ring-orange-500"
                >
                  <MapPin aria-hidden="true" className="size-5 shrink-0 text-orange-700" />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-navy-900">{localized(city.name, locale)}</span>
                    <span className="block truncate text-xs text-navy-500">{regionName(city.regionId)}</span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </Container>
    </section>
  );
}

/* E. How Wakati works ------------------------------------------------------ */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  const t = dict.howItWorks;
  const icons = [PenLine, MessageCircle, Handshake];
  return (
    <section aria-labelledby="how-it-works" className="bg-white py-12 sm:py-16">
      <Container>
        <SectionHeading id="how-it-works" title={t.title} lead={t.lead} />
        <ol className="grid gap-4 md:grid-cols-3">
          {t.steps.map((step, i) => {
            const Icon = icons[i] ?? PenLine;
            return (
              <li key={step.title} className="relative rounded-[var(--radius-card)] bg-canvas p-6 ring-1 ring-navy-100">
                <span className="absolute right-5 top-4 text-5xl font-extrabold text-navy-100" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-xl bg-orange-500 text-navy-900">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-navy-900">{step.title}</h3>
                <p className="mt-1 text-navy-500">{step.body}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 text-sm font-semibold text-navy-500">{t.note}</p>
      </Container>
    </section>
  );
}

/* F. Safety tips ----------------------------------------------------------- */
export function SafetyTips({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.safety;
  return (
    <section aria-labelledby="safety-tips" className="py-12 sm:py-16">
      <Container>
        <div className="grid gap-8 rounded-[1.5rem] bg-navy-900 p-6 text-white sm:p-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-orange-500">
              <ShieldCheck aria-hidden="true" className="size-7" />
            </span>
            <h2 id="safety-tips" className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t.title}
            </h2>
            <p className="mt-2 text-navy-100">{t.lead}</p>
            <Link
              href={localePath(locale, routes.legal("safety"))}
              className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-orange-500 hover:text-orange-100"
            >
              {t.readMore}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {t.tips.map((tip) => (
              <li key={tip} className="flex gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-orange-500" />
                <span className="text-sm leading-relaxed text-white">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* G. Post your first ad ---------------------------------------------------- */
export function PostAdCta({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.postCta;
  return (
    <section aria-labelledby="post-first-ad" className="pb-16 pt-4 sm:pb-20">
      <Container>
        <div className="flex flex-col items-start gap-6 rounded-[1.5rem] bg-orange-500 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 id="post-first-ad" className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              {t.title}
            </h2>
            <p className="mt-1 max-w-xl font-medium text-navy-900">{t.body}</p>
          </div>
          <ButtonLink
            href={localePath(locale, routes.postAd)}
            size="lg"
            variant="dark"
          >
            <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
            {t.button}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
