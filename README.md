# Wakati

**Buy • Sell • Find Locally.** A bilingual (English/French) classifieds marketplace for Cameroon.

Wakati connects buyers and sellers. It does not handle payments, delivery or escrow.

> Status: **Phase A – Foundation.** Accounts, posting, listing pages and moderation tools
> are planned for Phases B and C (see [docs/ROADMAP.md](docs/ROADMAP.md)).

## Quick start

Requirements: Node.js 20.9+ (developed on Node 22), npm.

```bash
npm install
cp .env.example .env.local   # optional; works without Supabase
npm run dev                  # http://localhost:3000 → redirects to /en or /fr
```

Without Supabase credentials the site runs on the built-in reference data (categories,
regions, cities) and shows honest empty states. It never shows invented listings.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm test` | Unit, component and database/RLS tests (Vitest + PGlite) |
| `npm run db:seed:generate` | Regenerates `supabase/seed.sql` from `src/lib/reference` |
| `npm run check` | All of the above in order |

## Database setup (Supabase)

1. Create a project at supabase.com (free tier is enough; do not enable paid add-ons
   without approval).
2. Apply the migrations in `supabase/migrations` in order (SQL editor or `supabase db push`),
   then run `supabase/seed.sql`.
3. Put the project URL and anon key in `.env.local` (see `.env.example`).
4. To make someone a moderator/admin, insert into `public.user_roles` using the SQL editor.

The seed only contains reference data (categories, category fields, regions, cities).

## Documentation

- [Architecture](docs/ARCHITECTURE.md): stack, structure, i18n, data access, security model
- [Roadmap](docs/ROADMAP.md): Phase B and C scope and prerequisites
- [Brand assets](public/brand/README.md): official logo files, slots and colour rules

## Legal

The Terms, Privacy, Safety and Prohibited Items pages are **draft placeholders pending legal
review**. They are marked as drafts on the page and excluded from search indexing.
