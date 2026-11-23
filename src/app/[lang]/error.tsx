"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { defaultLocale, isLocale } from "@/i18n/config";
import { errorMessages } from "@/i18n/dictionaries/errors";

/** Error boundary for every page under /[lang]. */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const params = useParams<{ lang: string }>();
  const locale = isLocale(params?.lang) ? params.lang : defaultLocale;
  const t = errorMessages[locale];

  useEffect(() => {
    // Phase C: forward to an error-reporting service once one is approved.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-700">
        <TriangleAlert aria-hidden="true" className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-navy-900">{t.genericTitle}</h1>
      <p className="mt-2 text-navy-500">{t.genericBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-orange-500 px-5 font-bold text-navy-900 hover:bg-orange-600"
        >
          {t.retry}
        </button>
        <a
          href={`/${locale}`}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-5 font-bold text-navy-900 ring-1 ring-navy-100 hover:bg-navy-50"
        >
          {t.backHome}
        </a>
      </div>
    </div>
  );
}
