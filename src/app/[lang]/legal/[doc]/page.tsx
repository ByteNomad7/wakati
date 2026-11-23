import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, TriangleAlert } from "lucide-react";
import { getDictionary, getLocale } from "@/i18n/server";
import { routes } from "@/i18n/paths";
import { pageMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/primitives";

const legalDocs = ["terms", "privacy", "safety", "prohibited-items"] as const;
type LegalDoc = (typeof legalDocs)[number];
const isLegalDoc = (v: string): v is LegalDoc => (legalDocs as readonly string[]).includes(v);

export async function generateStaticParams() {
  return legalDocs.map((doc) => ({ doc }));
}

async function resolveDoc(params: PageProps<"/[lang]/legal/[doc]">["params"]) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();
  return doc;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/legal/[doc]">): Promise<Metadata> {
  const locale = await getLocale();
  const [dict, doc] = await Promise.all([getDictionary(locale), resolveDoc(params)]);
  // Drafts are not indexed until approved by legal counsel.
  return pageMetadata({ locale, path: routes.legal(doc), title: dict.legal.docs[doc].title, index: false });
}

/**
 * DRAFT PLACEHOLDERS ONLY. These pages list the sections a qualified lawyer must
 * write and approve. They intentionally contain no binding terms or guarantees.
 */
export default async function LegalPage({ params }: PageProps<"/[lang]/legal/[doc]">) {
  const locale = await getLocale();
  const [dict, doc] = await Promise.all([getDictionary(locale), resolveDoc(params)]);
  const t = dict.legal;
  const content = t.docs[doc];

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <div role="note" className="flex gap-3 rounded-[var(--radius-card)] bg-orange-50 p-4 ring-2 ring-orange-500">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-orange-700" />
        <div>
          <p className="font-extrabold uppercase tracking-wide text-navy-900">{t.draftBanner}</p>
          <p className="mt-1 text-sm text-navy-800">{t.draftBody}</p>
        </div>
      </div>

      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{content.title}</h1>
      <p className="mt-2 text-sm font-semibold text-navy-500">{t.lastUpdated}</p>

      {doc === "safety" ? (
        <section aria-labelledby="tips" className="mt-8 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-navy-100">
          <h2 id="tips" className="text-lg font-extrabold text-navy-900">{dict.safety.title}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-navy-800">
            {dict.safety.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="outline" className="mt-8 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-navy-100">
        <h2 id="outline" className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
          <FileText aria-hidden="true" className="size-5 text-navy-500" />
          {t.outlineHeading}
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-navy-800 marker:font-bold marker:text-navy-500">
          {content.sections.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
    </Container>
  );
}
