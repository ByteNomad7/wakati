import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl, jsonLd } from "@/lib/seo/metadata";

export interface Crumb {
  label: string;
  href: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
  return (
    <nav aria-label={label} className="text-sm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <ol className="flex flex-wrap items-center gap-1 text-navy-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="font-semibold text-navy-900">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="hover:text-navy-900 hover:underline">
                    {item.label}
                  </Link>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
