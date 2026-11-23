import { getDictionary, getLocale } from "@/i18n/server";
import { localePath, routes } from "@/i18n/paths";
import { ButtonLink, Container } from "@/components/ui/primitives";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <Container className="flex max-w-xl flex-col items-center py-20 text-center">
      <p className="text-6xl font-extrabold text-orange-500">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-navy-900">{dict.errors.notFoundTitle}</h1>
      <p className="mt-2 text-navy-500">{dict.errors.notFoundBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={localePath(locale)} variant="dark">{dict.errors.backHome}</ButtonLink>
        <ButtonLink href={localePath(locale, routes.search)} variant="secondary">{dict.search.submit}</ButtonLink>
      </div>
    </Container>
  );
}
