import Link from "next/link";
import { localeNames, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { interpolate } from "@/i18n/format";
import { localized } from "@/i18n/localized";
import { localePath, routes } from "@/i18n/paths";
import { buildCategoryTree } from "@/lib/data/category-tree";
import type { Category } from "@/lib/data/types";
import { publicEnv } from "@/lib/env";
import { LogoHorizontalReverse } from "@/components/brand/Logo";
import { Container } from "@/components/ui/primitives";

export function SiteFooter({
  locale,
  dict,
  categories,
  year,
}: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  year: number;
}) {
  const t = dict.footer;
  const href = (path: string) => localePath(locale, path);
  const tree = buildCategoryTree(categories);
  const supportEmail = publicEnv.NEXT_PUBLIC_SUPPORT_EMAIL;

  const linkClass = "inline-flex min-h-9 items-center text-sm text-navy-100 hover:text-white";

  return (
    <footer className="mt-auto bg-navy-900 text-white">
      <Container className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <LogoHorizontalReverse className="h-11 w-auto" />
          <p className="mt-2 text-sm font-semibold text-orange-500">{dict.meta.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-navy-100">{t.about}</p>
        </div>

        <FooterColumn title={t.marketplace}>
          <li><Link className={linkClass} href={href(routes.postAd)}>{dict.nav.postAd}</Link></li>
          <li><Link className={linkClass} href={href(routes.search)}>{dict.search.submit}</Link></li>
          {tree.slice(0, 4).map((c) => (
            <li key={c.id}>
              <Link className={linkClass} href={href(routes.category(c.slug))}>{localized(c.name, locale)}</Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={t.support}>
          <li><Link className={linkClass} href={href(routes.legal("safety"))}>{t.safetyTips}</Link></li>
          {supportEmail ? (
            <li><a className={linkClass} href={`mailto:${supportEmail}`}>{t.contact}</a></li>
          ) : null}
        </FooterColumn>

        <FooterColumn title={t.legal}>
          <li><Link className={linkClass} href={href(routes.legal("terms"))}>{t.terms}</Link></li>
          <li><Link className={linkClass} href={href(routes.legal("privacy"))}>{t.privacy}</Link></li>
          <li><Link className={linkClass} href={href(routes.legal("prohibited-items"))}>{t.prohibited}</Link></li>
        </FooterColumn>

        <FooterColumn title={t.languages}>
          {locales.map((l) => (
            <li key={l}>
              <Link className={linkClass} href={localePath(l)} hrefLang={l} lang={l} aria-current={l === locale ? "true" : undefined}>
                {localeNames[l]}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>{interpolate(t.rights, { year })}</p>
          <p>{t.intermediary}</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
      <ul className="mt-3 space-y-1">{children}</ul>
    </div>
  );
}
