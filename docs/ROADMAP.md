# Roadmap

## Phase A – Foundation (this branch)

Done: repository structure, design system and brand integration, homepage and navigation,
database-driven categories and locations, English/French localization, database schema with
RLS foundations, draft legal placeholders, SEO groundwork, tests.

## Phase B preparation (branch `phase-b/supabase-dev-setup`)

Done: `supabase/config.toml`; explicit Data API grants; sign-up profile trigger;
verification-guard bug fix; integration tests against a real Supabase stack; GitHub Actions
CI; manual migrate-to-dev workflow; reverse logo and maskable icon. See docs/SUPABASE.md.

## Phase B – Marketplace (next)

Prerequisites (owner decisions / setup):

- [ ] Create the Supabase **development** project and GitHub `development` secrets, then run
      the migrate workflow (docs/SUPABASE.md).
- [ ] Choose auth methods: email + password with email confirmation is supported out of the
      box. Phone/SMS OTP needs an SMS provider (paid); do not advertise it until integrated.
- [ ] Provide a verified neighbourhood list per launch city.
- [ ] Decide listing expiry period and maximum photos per listing (schema allows 20).

Build:

- [ ] Auth: register, login, logout, password recovery, session refresh in `src/proxy.ts`
      using `@supabase/ssr`, profile + `user_settings` rows created on sign-up.
- [ ] Profile page: display name, photo (avatars bucket), preferred language.
- [ ] Post an ad: multi-step mobile form, category-specific fields from `category_attributes`
      validated with `attributesSchema()`, condition when `has_condition`, city + optional
      neighbourhood, contact preference + consent, draft → preview → publish.
- [ ] Photo uploads: client-side downscale, server-side re-encode to WebP, size/MIME checks,
      EXIF/location stripping, `listing_images` rows.
- [ ] Listing detail page `/[lang]/l/[slug]`: gallery, details, seller card, contact reveal
      via `reveal_listing_contact()` with WhatsApp deep link, save, share, report entry point,
      related listings, `Product`/`Offer` structured data. Make `ListingCard` link to it.
- [ ] Search filters UI: subcategory, price range, condition, sort, category-specific filters
      (`is_filterable` attributes). The query layer already supports price/condition/sort.
- [ ] My Ads dashboard (edit, archive, delete drafts) and Favourites (`saved_listings`).
- [ ] Call `updateTag("listings")` after listing writes; add published listings to the sitemap.
- [ ] Replace the four "coming soon" routes.
- [ ] End-to-end tests (Playwright) for the core flows.

## Phase C – Trust & administration

Reporting UI, moderation queue, admin dashboard (users, listings, categories, locations,
reports, restrictions, settings, real statistics), rate limiting at the edge, spam heuristics,
audit trail views, error monitoring, SEO completion (hard 404s, listing structured data),
security review. Approved legal texts must replace the draft placeholders before launch.

## Not planned without separate approval

Payments, escrow, wallets, MTN MoMo / Orange Money collection, paid promotion, subscriptions,
delivery tracking, buyer protection, in-app messaging, identity/phone verification badges.
