import { Clock3 } from "lucide-react";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/server";
import { localePath, routes } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo/metadata";
import { ButtonLink, Container } from "@/components/ui/primitives";

export type ComingSoonPage = "loginTitle" | "registerTitle" | "favoritesTitle" | "postAdTitle";

/**
 * Honest placeholder for Phase B features linked from the navigation.
 * It never pretends the feature works and is excluded from search indexing.
 */
export async function comingSoonMetadata(titleKey: ComingSoonPage, path: string): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return pageMetadata({ locale, path, title: dict.comingSoon[titleKey], index: false });
}

export async function ComingSoon({ titleKey }: { titleKey: ComingSoonPage }) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const t = dict.comingSoon;
  return (
    <Container className="flex max-w-2xl flex-col items-center py-16 text-center sm:py-24">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-navy-900 text-orange-500">
        <Clock3 aria-hidden="true" className="size-8" />
      </span>
      <p className="mt-6 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 ring-1 ring-orange-100">
        {t.badge}
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy-900">{t[titleKey]}</h1>
      <p className="mt-3 text-navy-500">{t.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={localePath(locale)} variant="dark">
          {t.backHome}
        </ButtonLink>
        <ButtonLink href={localePath(locale, routes.search)} variant="secondary">
          {dict.search.submit}
        </ButtonLink>
      </div>
    </Container>
  );
}
