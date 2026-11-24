import "@fontsource-variable/manrope";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCatalog } from "@/lib/data/queries";
import { deploymentEnv, isSupabaseConfigured, siteUrl } from "@/lib/env";
import { brandColors } from "@/lib/brand/tokens";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/ui/primitives";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    metadataBase: new URL(siteUrl),
    applicationName: "Wakati",
    title: { default: dict.meta.homeTitle, template: "%s · Wakati" },
    description: dict.meta.homeDescription,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: brandColors.navy,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const [dict, catalog] = await Promise.all([getDictionary(locale), getCatalog()]);
  const year = new Date().getUTCFullYear();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {deploymentEnv === "development" ? (
          <div role="note" className="bg-orange-500 px-4 py-1 text-center text-xs font-bold text-navy-900">
            {dict.common.previewBanner}
          </div>
        ) : null}
        <SiteHeader
          locale={locale}
          dict={dict}
          categories={catalog.categories}
          cities={catalog.cities}
          regions={catalog.regions}
        />
        {process.env.NODE_ENV !== "production" && !isSupabaseConfigured() ? (
          <div role="note" className="border-b border-orange-100 bg-orange-50 text-sm text-navy-800">
            <Container className="py-2">{dict.common.devDataNotice}</Container>
          </div>
        ) : null}
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} categories={catalog.categories} year={year} />
      </body>
    </html>
  );
}
