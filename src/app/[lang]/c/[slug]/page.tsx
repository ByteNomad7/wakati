import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getDictionary, getLocale } from "@/i18n/server";
import { interpolate } from "@/i18n/format";
import { localized } from "@/i18n/localized";
import { localePath, routes } from "@/i18n/paths";
import { categoryPath, findCategoryBySlug } from "@/lib/data/category-tree";
import { getCatalog } from "@/lib/data/queries";
import { parseSearchParams } from "@/lib/search/params";
import { pageMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SearchResults } from "@/components/listings/SearchResults";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/primitives";

/**
 * Rendered per request: listings are always current, and an unknown category slug
 * returns a real HTTP 404. Category URLs come from the database (no static list).
 */
export const dynamic = "force-dynamic";

async function resolveCategory(params: PageProps<"/[lang]/c/[slug]">["params"]) {
  const { slug } = await params;
  const { categories } = await getCatalog();
  const category = findCategoryBySlug(categories, slug);
  if (!category) notFound();
  return { category, categories };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/c/[slug]">): Promise<Metadata> {
  const locale = await getLocale();
  const [dict, { category }] = await Promise.all([getDictionary(locale), resolveCategory(params)]);
  const name = localized(category.name, locale);
  return pageMetadata({
    locale,
    path: routes.category(category.slug),
    title: interpolate(dict.meta.categoryTitle, { category: name }),
    description: interpolate(dict.meta.categoryDescription, { category: name }),
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[lang]/c/[slug]">) {
  const locale = await getLocale();
  const [dict, { category, categories }] = await Promise.all([getDictionary(locale), resolveCategory(params)]);
  const name = localized(category.name, locale);
  const path = categoryPath(categories, category);
  const children = categories
    .filter((c) => c.parentId === category.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const siblings = category.parentId
    ? categories.filter((c) => c.parentId === category.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const chips = children.length > 0 ? children : siblings;

  return (
    <>
      <section className="border-b border-navy-100 bg-white">
        <Container className="py-6 sm:py-8">
          <Breadcrumbs
            label={dict.category.breadcrumb}
            items={[
              { label: dict.nav.home, href: localePath(locale) },
              ...path.map((c) => ({ label: localized(c.name, locale), href: localePath(locale, routes.category(c.slug)) })),
            ]}
          />
          <div className="mt-4 flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-orange-500">
              <CategoryIcon icon={path[0]?.icon ?? null} className="size-7" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{name}</h1>
          </div>

          {category.moderationLevel === "review_required" ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-sm text-navy-800 ring-1 ring-orange-100">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-orange-700" />
              {dict.category.reviewNotice}
            </p>
          ) : null}

          {chips.length > 0 ? (
            <nav aria-label={dict.category.subcategories} className="mt-5">
              <ul className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {chips.map((c) => {
                  const active = c.id === category.id;
                  return (
                    <li key={c.id} className="shrink-0">
                      <Link
                        href={localePath(locale, routes.category(c.slug))}
                        aria-current={active ? "page" : undefined}
                        className={
                          active
                            ? "inline-flex min-h-10 items-center rounded-full bg-navy-900 px-4 text-sm font-bold text-white"
                            : "inline-flex min-h-10 items-center rounded-full bg-canvas px-4 text-sm font-semibold text-navy-800 ring-1 ring-navy-100 hover:ring-orange-500"
                        }
                      >
                        {localized(c.name, locale)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </Container>
      </section>

      <Container className="py-8 sm:py-10">
        <h2 className="mb-4 text-xl font-extrabold text-navy-900">
          {interpolate(dict.category.listingsIn, { category: name })}
        </h2>
        <CategoryResults searchParams={searchParams} slug={category.slug} locale={locale} dict={dict} />
      </Container>
    </>
  );
}

async function CategoryResults({
  searchParams,
  slug,
  locale,
  dict,
}: {
  searchParams: PageProps<"/[lang]/c/[slug]">["searchParams"];
  slug: string;
  locale: Awaited<ReturnType<typeof getLocale>>;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const { query } = parseSearchParams(await searchParams);
  const filtered = Boolean(query.q || query.city || query.condition || query.minPrice !== undefined || query.maxPrice !== undefined);
  return (
    <SearchResults
      locale={locale}
      dict={dict}
      query={{ ...query, category: slug }}
      basePath={routes.category(slug)}
      clearHref={filtered ? localePath(locale, routes.category(slug)) : undefined}
      empty={filtered ? undefined : { title: dict.listings.emptyTitle, body: dict.listings.emptyBody }}
    />
  );
}
