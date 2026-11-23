"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/paths";
import { cx } from "@/components/ui/primitives";

/**
 * Switches language while staying on the same page. Each option is a real link
 * to the other locale's URL (server-rendered content, not text replacement).
 */
export function LanguageSwitcher({
  current,
  label,
  tone = "light",
}: {
  current: Locale;
  label: string;
  tone?: "light" | "dark";
}) {
  const pathname = usePathname() ?? `/${current}`;
  return (
    <nav aria-label={label} className="flex items-center">
      <ul
        className={cx(
          "flex rounded-full p-0.5 text-xs font-bold",
          tone === "light" ? "bg-navy-50 ring-1 ring-navy-100" : "bg-white/10 ring-1 ring-white/20",
        )}
      >
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <Link
                href={switchLocalePath(pathname, locale)}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                prefetch={false}
                className={cx(
                  "inline-flex min-h-9 min-w-10 items-center justify-center rounded-full px-2.5 uppercase transition-colors",
                  active
                    ? tone === "light"
                      ? "bg-navy-900 text-white"
                      : "bg-white text-navy-900"
                    : tone === "light"
                      ? "text-navy-700 hover:text-navy-900"
                      : "text-white/80 hover:text-white",
                )}
              >
                {locale}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
