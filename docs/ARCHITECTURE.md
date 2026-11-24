# Wakati architecture (Phase A)

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16.4 (App Router), React 19, TypeScript (strict) | Cache Components **off**: it is not reliable on Cloudflare Workers yet (see docs/CLOUDFLARE.md) |
| Styling | Tailwind CSS 4 with brand tokens in `src/app/globals.css` | Tokens mirrored in `src/lib/brand/tokens.ts`; a test keeps them in sync |
| Font | Manrope, self-hosted (`@fontsource-variable/manrope`) | No request to Google Fonts |
| Data | Supabase PostgreSQL + RLS (`supabase/migrations`) | Optional in Phase A; reference fallback when not configured |
| Auth / Storage | Supabase Auth / Storage | Schema and policies ready; UI is Phase B |
| Validation | Zod | Env, search params, category-specific listing fields |
| Tests | Vitest, Testing Library, PGlite (in-process Postgres) | Migrations and RLS run against a real Postgres engine |

## Directory map

```
src/
  app/
    [lang]/                 Root layout per language (en | fr) – every page is localized
      page.tsx              Homepage (sections A–H)
      c/[slug]/page.tsx     Category & subcategory pages (one URL per DB category)
      search/page.tsx       Database-backed search with shareable URLs
      legal/[doc]/page.tsx  Draft legal placeholders (noindex)
      login|register|favorites|post-ad/  Honest "coming next release" pages (noindex)
      error.tsx, not-found.tsx, loading.tsx
    robots.ts, sitemap.ts, manifest.ts, icon.svg, apple-icon.png, favicon.ico
  proxy.ts                  Locale negotiation and redirects (Next 16 "proxy" = middleware)
  i18n/                     Locale config, typed dictionaries (en, fr), formatting, paths
  lib/
    brand/tokens.ts         Brand colours, derived palette, contrast rules, asset slots
    data/                   Domain types, repository interface + implementations, cached queries
    reference/              Launch categories & locations (seed source) + seed SQL builder
    search/params.ts        Search URL parsing/serialising (Zod)
    seo/metadata.ts         Canonical, hreflang, Open Graph, JSON-LD helpers
    supabase/               Public (cookie-less) client and session-aware server client
  components/               brand/, layout/, home/, listings/, search/, ui/
supabase/
  migrations/               Schema, RLS, guards, storage buckets
  seed.sql                  GENERATED from src/lib/reference (npm run db:seed:generate)
tests/                      Unit, component and database (RLS) tests
```

## Internationalization

- Locale lives in the URL (`/en/...`, `/fr/...`), so every page is server-rendered in its
  language, crawlable and shareable. `src/proxy.ts` redirects locale-less paths using the
  `WAKATI_LOCALE` cookie, then `Accept-Language`, then English.
- `next/root-params` gives any Server Component the current locale (`getLocale()`).
- `src/i18n/dictionaries/en.ts` defines the `Dictionary` type; `fr.ts` must satisfy it, so a
  missing French key fails `tsc`. Tests also check structure, list lengths and placeholders.
- Database content that is reference data (categories, regions, cities, field labels) is
  stored bilingually (`name_en`, `name_fr`). User content (titles, descriptions) is stored
  as written with `content_language`, never machine-translated.
- Metadata includes canonical URLs and `en-CM` / `fr-CM` / `x-default` alternates.

## Data access

`MarketplaceRepository` (`src/lib/data/repository.ts`) is the only way pages read data:

- `createSupabaseRepository()` reads with the publishable key (Postgres role `anon`), so RLS applies. Listings are read
  from the `public_listing_cards` view (published, non-expired, no private columns).
- `referenceRepository` is used when Supabase env vars are missing. It returns the launch
  categories/locations and **zero listings**. It never fabricates activity.

`src/lib/data/queries.ts` applies the caching policy:

- **Listings: never cached.** Every request reads published listings from Supabase, so
  new, edited, archived or removed listings are reflected immediately. Phase B writes need
  no cache invalidation.
- **Reference data** (categories, regions, cities): in-memory TTL cache, 5 minutes per
  Worker instance (`src/lib/data/ttl-cache.ts`). It shares in-flight loads, never caches
  failures, and never serves past the TTL. Admin edits appear within 5 minutes;
  `invalidateCatalog()` clears the current instance's copy.
- React `cache()` deduplicates identical calls within one request.

This deliberately avoids the Next.js data cache and Cache Components, which failed on
deployed Cloudflare Workers.

## Categories

- `categories` is a self-referencing tree; `category_attributes` defines per-category listing
  fields (text, integer, decimal, year, select, boolean) with bilingual labels and options.
- Fields are inherited by descendants (`effectiveAttributes()`); for example, Property's
  rent/sale, type, rooms and area apply to every property subcategory.
- `attributesSchema()` builds a strict Zod validator from those definitions for the Phase B
  "Post an ad" server action, so new categories and fields need no new code or pages.
- `moderation_level = 'review_required'` (currently Jobs) turns "publish" into
  `pending_review` in the database trigger, not just in the UI.

## Locations

`regions` (10) → `cities` (12 launch cities) → `neighbourhoods` (table ready, **not seeded**:
load a verified list before enabling the optional neighbourhood picker). Listings store
`city_id` and optional `neighbourhood_id` only; there is no street address column, so
precise residential addresses are never stored or shown.

## Security model (database)

- RLS is enabled on every table. Reference data is public-read and admin-write.
- `listings`: public sees `published` only; owners see and edit their own; moderators see all.
  The `guard_listing_write` trigger blocks API users from changing the seller, featuring,
  setting rejection/removal states, undoing moderation, or posting while restricted.
- Contact numbers live in `seller_contacts` (owner-only). They can only be read through
  `reveal_listing_contact()`: sign-in required, explicit seller consent required, 30 reveals
  per hour per user, and every reveal logged in `contact_reveals`, which helps prevent harvesting.
- Verification flags (`business_verification`, `phone_verification`) cannot be set through
  the API. Nothing marks anyone as verified yet, and no badge is shown.
- Roles are in `user_roles` (`moderator`, `admin`) and checked by `has_role()` / `is_staff()`.
- Duplicate active submissions per seller are blocked by a unique fingerprint index.
- `audit_log` is append-only for staff.

These rules are verified by `tests/db/rls.test.ts`, which applies the real migrations to
PGlite with a minimal Supabase shim (`tests/support/supabase-shim.sql`).

## Rendering and performance

- **Live-data pages render on every request** (`dynamic = "force-dynamic"`): home, category
  and search. They are sent with `Cache-Control: private, no-store`, so no CDN or browser
  can serve a stale copy. Results are part of the response, not streamed separately, so a
  failure produces a visible error (HTTP 500 / error page) instead of a missing section.
  There is no route-level `loading.tsx`, for the same reason: it would commit HTTP 200
  before the page could return 404 or 500.
- **Static pages are prerendered** for both locales (legal, placeholders, auth confirmed)
  and served from the cache.
- Search is a plain GET form: it works without JavaScript. Client JS is limited to the
  mobile menu and the language switcher.
- Images: AVIF/WebP via `next/image`, remote pattern limited to the project's Supabase
  public storage path.

## Known limitations

- (Resolved) Unknown category and legal slugs return HTTP 404 with the localized 404 page.
- The header city selector appears on very wide screens (≥1536px). On smaller screens city
  selection is in the hero and search-page forms.
