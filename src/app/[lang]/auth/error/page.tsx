import { Suspense } from "react";
import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { getDictionary, getLocale, type Dictionary } from "@/i18n/server";
import { localePath } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo/metadata";
import { ButtonLink, Container } from "@/components/ui/primitives";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return pageMetadata({ locale, path: "/auth/error", title: dict.auth.errorTitle, index: false });
}

export default async function AuthErrorPage({ searchParams }: PageProps<"/[lang]/auth/error">) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <Container className="flex max-w-xl flex-col items-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-700">
        <TriangleAlert aria-hidden="true" className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-navy-900">{dict.auth.errorTitle}</h1>
      <Suspense fallback={<p className="mt-2 text-navy-500">{dict.auth.invalidBody}</p>}>
        <Reason dict={dict} searchParams={searchParams} />
      </Suspense>
      <ButtonLink href={localePath(locale)} variant="dark" className="mt-8">
        {dict.errors.backHome}
      </ButtonLink>
    </Container>
  );
}

async function Reason({ dict, searchParams }: { dict: Dictionary; searchParams: PageProps<"/[lang]/auth/error">["searchParams"] }) {
  const { reason } = await searchParams;
  const body =
    reason === "expired" ? dict.auth.expiredBody : reason === "unavailable" ? dict.auth.unavailableBody : dict.auth.invalidBody;
  return <p className="mt-2 text-navy-500">{body}</p>;
}
