import Link from "next/link";
import { Heart, Plus, UserRound } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localized } from "@/i18n/localized";
import { localePath, routes } from "@/i18n/paths";
import { buildCategoryTree } from "@/lib/data/category-tree";
import type { Category, City, Region } from "@/lib/data/types";
import { LogoHorizontal } from "@/components/brand/Logo";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { SearchForm } from "@/components/search/SearchForm";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

interface Props {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  cities: City[];
  regions: Region[];
}

export function SiteHeader({ locale, dict, categories, cities, regions }: Props) {
  const t = dict.nav;
  const tree = buildCategoryTree(categories);
  const href = (path: string) => localePath(locale, path);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
      >
        {t.skipToContent}
      </a>

      {/*
        One search form for every breakpoint: on mobile the grid places it on a
        second row under the logo; from md it sits between logo and account nav.
        Rendering it once (instead of a desktop and a mobile copy) halves the
        header's server render cost on every request.
      */}
      <Container className="grid grid-cols-[auto_1fr] items-center gap-x-3 md:grid-cols-[auto_1fr_auto] lg:gap-x-6">
        <Link
          href={href(routes.home)}
          className="col-start-1 row-start-1 flex h-16 shrink-0 items-center lg:h-[4.5rem]"
          aria-label={`Wakati – ${t.home}`}
        >
          <LogoHorizontal priority className="h-9 w-auto lg:h-10" />
        </Link>

        <div className="col-span-2 row-start-2 min-w-0 pb-3 md:col-span-1 md:col-start-2 md:row-start-1 md:pb-0">
          <SearchForm
            variant="header"
            locale={locale}
            dict={dict}
            categories={categories}
            cities={cities}
            regions={regions}
          />
        </div>

        <nav aria-label={t.account} className="col-start-2 row-start-1 flex items-center justify-self-end gap-1 md:col-start-3 lg:gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher current={locale} label={t.language} />
          </div>
          <Link
            href={href(routes.favorites)}
            className="hidden size-11 items-center justify-center rounded-[var(--radius-control)] text-navy-900 hover:bg-navy-50 sm:inline-flex"
          >
            <Heart aria-hidden="true" className="size-5" />
            <span className="sr-only">{t.favorites}</span>
          </Link>
          <Link
            href={href(routes.login)}
            className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-sm font-bold text-navy-900 hover:bg-navy-50 lg:inline-flex"
          >
            <UserRound aria-hidden="true" className="size-5" />
            <span className="sr-only xl:not-sr-only">{t.login}</span>
            <span aria-hidden="true" className="hidden text-navy-300 xl:inline">/</span>
            <span className="sr-only xl:not-sr-only">{t.register}</span>
          </Link>
          <span className="hidden sm:block">
            <ButtonLink href={href(routes.postAd)} className="whitespace-nowrap">
              <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
              {t.postAd}
            </ButtonLink>
          </span>
          <span className="sm:hidden">
            <ButtonLink href={href(routes.postAd)} className="px-3" aria-label={t.postAd}>
              <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />
            </ButtonLink>
          </span>
          <div className="lg:hidden">
            <MobileMenu
              openLabel={t.openMenu}
              closeLabel={t.closeMenu}
              title="Wakati"
              sections={[
                {
                  heading: t.account,
                  links: [
                    { href: href(routes.login), label: t.login, icon: <UserRound aria-hidden="true" className="size-5 text-navy-500" /> },
                    { href: href(routes.register), label: t.register, icon: <UserRound aria-hidden="true" className="size-5 text-navy-500" /> },
                    { href: href(routes.favorites), label: t.favorites, icon: <Heart aria-hidden="true" className="size-5 text-navy-500" /> },
                    { href: href(routes.postAd), label: t.postAd, icon: <Plus aria-hidden="true" className="size-5 text-orange-700" /> },
                  ],
                },
                {
                  heading: t.categories,
                  links: tree.map((c) => ({
                    href: href(routes.category(c.slug)),
                    label: localized(c.name, locale),
                    icon: <CategoryIcon icon={c.icon} className="size-5 text-navy-500" />,
                  })),
                },
              ]}
              footer={<LanguageSwitcher current={locale} label={t.language} />}
            />
          </div>
        </nav>
      </Container>

      <nav aria-label={t.categories} className="border-t border-navy-100 bg-white">
        <Container>
          <ul className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto py-2">
            {tree.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={href(routes.category(c.slug))}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                >
                  <CategoryIcon icon={c.icon} className="size-4 text-orange-700" />
                  {localized(c.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  );
}
