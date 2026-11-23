# Supabase setup and verification

Wakati uses one Supabase **development** project for Phase B. Production is out of scope
until separately approved. Credentials never go into the repository: locally they live in
`.env.local` (git-ignored), in CI they are GitHub **environment secrets**.

## How the backend is verified

| Layer | Where | What it proves |
| --- | --- | --- |
| PGlite tests (`npm test`) | Every machine, every CI run | Migrations apply; RLS, triggers and grants behave correctly in Postgres, with **no** default table grants |
| `supabase-local` CI job | GitHub Actions, real Supabase containers (Postgres 17, Auth, PostgREST, Storage) via `supabase start` | Migrations + seed apply as on Supabase; `supabase db lint`; seed idempotency; email/password auth; RLS through the Data API; storage rules; the production build renders live data |
| `supabase-dev` CI job | GitHub Actions → hosted development project | The same integration tests against the hosted project, once its secrets exist |
| `Apply migrations to Supabase DEVELOPMENT` workflow | Manual only | Dry-run, then apply pending migrations (+ idempotent seed) to the dev project |

The local config in `supabase/config.toml` mirrors the hosted settings below. It sets
`auto_expose_new_tables = false`, so CI proves the schema works even when tables are not
auto-exposed.

## 1. Create the development project (owner action)

1. In Supabase, create a project named for example `wakati-dev` on the **Free** plan, in the
   region closest to Cameroon (for example `eu-west` / Frankfurt or London). Save the
   database password in a password manager.
2. Do **not** enable paid add-ons (compute upgrades, PITR, custom domains, SMS, IPv4).

## 2. Configure Authentication (Dashboard → Authentication)

| Setting | Value |
| --- | --- |
| Sign In / Providers → **Email** | Enabled |
| Confirm email | **On** |
| Secure email change | On |
| Secure password change | On |
| Minimum password length | **8** |
| Password requirements | Letters and digits |
| **Phone** provider | **Disabled** (no SMS provider) |
| Anonymous sign-ins | Disabled |
| All OAuth / social providers | Disabled for now |
| Leaked password protection | Leave off (Pro-plan feature) |
| URL Configuration → Site URL | `http://localhost:3000` (dev) |
| URL Configuration → Redirect URLs | `http://localhost:3000/en/auth/callback`, `http://localhost:3000/fr/auth/callback` (add preview URLs later) |

**Email delivery:** Supabase's built-in email service is for testing only. It sends to
project team members' addresses only, at a very low hourly rate. Testers who are not team
members won't receive confirmation emails. Before inviting outside testers, configure custom
SMTP (Dashboard → Authentication → Emails → SMTP). Choosing an email provider is an owner
decision, and none has been activated.

## 3. Data API (Dashboard → Project Settings → Data API)

- Exposed schemas: `public` (default).
- "Automatically expose new tables" can be on or off; Wakati's migrations grant exactly what
  is needed either way.

## 4. Apply the schema

Option A, from GitHub (recommended): add the secrets below, then run **Actions → Apply
migrations to Supabase DEVELOPMENT** with `dry_run = true`, review the output, and run it
again with `dry_run = false`.

Option B, from a developer machine with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <dev-project-ref>
npx supabase db push --remote --dry-run --include-seed
npx supabase db push --remote --include-seed
```

Note: in CLI v3, `db push` targets the **local** database unless `--remote` is passed.

## 5. Secrets

Create a GitHub **environment** named `development` (Settings → Environments) and add:

| Secret | Where to find it | Used by |
| --- | --- | --- |
| `SUPABASE_DEV_URL` | Project Settings → API → Project URL | integration tests |
| `SUPABASE_DEV_ANON_KEY` | Project Settings → API keys → `anon` / publishable | integration tests |
| `SUPABASE_DEV_SERVICE_ROLE_KEY` | Project Settings → API keys → `service_role` / secret | integration tests (creates and deletes test users) |
| `SUPABASE_DEV_PROJECT_REF` | Project URL subdomain | migrate workflow |
| `SUPABASE_DEV_DB_PASSWORD` | Saved at project creation | migrate workflow |
| `SUPABASE_ACCESS_TOKEN` | Account → Access Tokens (create one for CI) | migrate workflow |

For local development, copy `.env.example` to `.env.local` and fill in the URL and anon key.
Never commit `.env.local`, and never expose the service role key to the browser.

## 6. First admin

After you sign up through the app (Phase B) and confirm your email, run this in the SQL
editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com';
```

## Integration test hygiene

The integration tests create users with addresses like
`wakati.ci+<name>.<run>@example.com` and delete them (and their listings and uploads) at
the end of each run. They create confirmed users through the admin API, so no email is sent
for those. The sign-up test calls the public sign-up endpoint once per run. If the hosted
project still uses Supabase's built-in email, which refuses non-team addresses, the test
falls back to creating the same unconfirmed user through the admin API.
