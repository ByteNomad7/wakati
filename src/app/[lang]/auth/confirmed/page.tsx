import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { getDictionary, getLocale } from "@/i18n/server";
import { localePath } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo/metadata";
import { ButtonLink, Container } from "@/components/ui/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return pageMetadata({ locale, path: "/auth/confirmed", title: dict.auth.confirmedTitle, index: false });
}

export default async function AuthConfirmedPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <Container className="flex max-w-xl flex-col items-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-navy-900 text-orange-500">
        <CircleCheck aria-hidden="true" className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-navy-900">{dict.auth.confirmedTitle}</h1>
      <p className="mt-2 text-navy-500">{dict.auth.confirmedBody}</p>
      <ButtonLink href={localePath(locale)} className="mt-8">
        {dict.auth.continue}
      </ButtonLink>
    </Container>
  );
}
