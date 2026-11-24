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
| `npm run test:integration` | Tests against a real Supabase stack (needs `SUPABASE_TEST_*` env; run in CI) |
| `npx supabase start` | Local Supabase stack (Docker) with migrations and seed applied |
| `npm run brand:generate` | Regenerates derived logo/icon variants from the approved artwork |
| `npm run db:seed:generate` | Regenerates `supabase/seed.sql` from `src/lib/reference` |
| `npm run check` | All of the above in order |

## Database setup (Supabase)

See [docs/SUPABASE.md](docs/SUPABASE.md) for the development project's settings, secrets and
the migration workflow. Locally, `npx supabase start` (Docker) gives a full stack with the
migrations and seed applied. The seed only contains reference data.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): stack, structure, i18n, data access, security model
- [Roadmap](docs/ROADMAP.md): Phase B and C scope and prerequisites
- [Supabase](docs/SUPABASE.md): development project configuration, secrets, verification
- [Brand assets](public/brand/README.md): official logo files, derived variants and colour rules

## Legal

The Terms, Privacy, Safety and Prohibited Items pages are **draft placeholders pending legal
review**. They are marked as drafts on the page and excluded from search indexing.
