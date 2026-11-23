import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category, City, Region } from "@/lib/data/types";
import { Container } from "@/components/ui/primitives";
import { SearchForm } from "@/components/search/SearchForm";

export function Hero(props: {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  cities: City[];
  regions: Region[];
}) {
  const { dict } = props;
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-navy-900 text-white">
      {/* Decorative arc echoing the logo's swoosh; purely ornamental. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/2 -z-10 w-[160%] max-w-none -translate-x-1/2 text-orange-500/90 sm:-bottom-52 lg:-bottom-72 lg:w-[120%]"
        viewBox="0 0 1200 300"
        fill="none"
      >
        <path d="M40 40C220 230 980 260 1160 40C1010 300 190 300 40 40Z" fill="currentColor" opacity="0.18" />
        <path d="M80 70C300 210 900 230 1120 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,rgba(255,121,22,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(44,80,115,0.9),transparent_60%)]"
      />

      <Container className="pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-orange-100 ring-1 ring-white/15">
          <span className="size-1.5 rounded-full bg-orange-500" aria-hidden="true" />
          {dict.meta.tagline}
        </p>
        <h1
          id="hero-title"
          className="mt-5 max-w-3xl text-[2.15rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
        >
          {dict.hero.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-100 sm:text-lg">{dict.hero.subtitle}</p>
        <div className="mt-8 max-w-5xl">
          <SearchForm variant="hero" id="hero-search" {...props} />
        </div>
      </Container>
    </section>
  );
}
