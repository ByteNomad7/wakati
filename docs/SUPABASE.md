# Supabase setup and verification

Wakati uses one Supabase **development** project for Phase B. Production is out of scope
until separately approved (see "Development vs production" below). Credentials never go
into the repository: locally they live in `.env.local` (git-ignored), and in CI they are
GitHub **environment secrets**.

> This repository is **public**. Anyone can read workflow logs and download workflow
> artifacts. Secrets are masked in logs and are never given to pull requests from forks,
> but never upload database data as an artifact and never print query results that
> contain user data.

## How the backend is verified

| Layer | Where | What it proves |
| --- | --- | --- |
| PGlite tests (`npm test`) | Every machine, every CI run | Migrations apply; RLS, triggers and grants behave correctly in Postgres, with **no** default table grants |
| `supabase-local` CI job | GitHub Actions, real Supabase containers (Postgres 17, Auth, PostgREST, Storage) via `supabase start` | Migrations + seed apply as on Supabase; `supabase db lint`; seed idempotency; email/password auth; RLS through the Data API with publishable/secret keys; storage rules; the production build renders live data |
| `supabase-dev` CI job | GitHub Actions → hosted development project | The same integration tests against the hosted project, once its secrets exist |
| `Apply migrations to Supabase DEVELOPMENT` workflow | Manual only | Lists migrations, snapshots the schema, then dry-runs or applies pending migrations (+ seed) |

The local config in `supabase/config.toml` mirrors the hosted settings below. It sets
`auto_expose_new_tables = false`, so CI proves the schema works even when tables are not
auto-exposed.

## 1. Create the development project (owner action)

1. In the Supabase dashboard, create a project, for example `wakati-dev`, on the **Free**
   plan. Pick an EU region from the region list; Europe is generally the nearest option
   for users in Cameroon.
2. Save the generated database password in a password manager. You will need it once, as
   a GitHub secret.
3. Do **not** enable paid add-ons (compute upgrades, PITR, custom domains, SMS, IPv4).

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
| Leaked password protection | Leave off (Pro plan and above only) |
| Email OTP expiration | 3600 seconds (confirmation links valid for 1 hour, as in local config) |
| URL Configuration → Site URL | `https://wakati-dev.<account>.workers.dev` (the Cloudflare development preview; see docs/CLOUDFLARE.md) |
| URL Configuration → Redirect URLs | `http://localhost:3000/*/auth/callback`, `https://wakati-dev.<account>.workers.dev/*/auth/callback`, `https://*-wakati-dev.<account>.workers.dev/*/auth/callback` |

**Email delivery:** Supabase's built-in email service is for testing only. It delivers only
to members of your Supabase organisation's team, and only **2 emails per hour** across the
whole project. Anyone else gets "Email address not authorized". Before inviting outside
testers, configure custom SMTP (Authentication → Emails → SMTP Settings). Choosing an email
provider is an owner decision, and none has been activated.

## 3. API keys (Dashboard → Project Settings → API Keys)

New Supabase projects issue a **publishable key** (`sb_publishable_…`) and a **secret
key** (`sb_secret_…`). These replace the legacy `anon` and `service_role` JWT keys, which
new projects no longer have and which Supabase is phasing out.

| Key | Safe in the browser? | Postgres role | Used for |
| --- | --- | --- | --- |
| Publishable | Yes | `anon`, or `authenticated` once signed in | The app; RLS applies |
| Secret | **Never** | `service_role` (bypasses RLS) | CI tests (create/delete test users); future trusted server code |

The app reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`
still works as a fallback.

## 4. Data API (Dashboard → Project Settings → Data API)

- Exposed schemas: `public` (default).
- Whether new tables are exposed automatically doesn't matter: Wakati's migrations grant
  exactly the privileges needed, and CI tests with automatic exposure off.

## 5. GitHub secrets

In GitHub: **Settings → Environments → `development`** (create it if missing). Add these
secrets to the environment, not to repository-wide secrets:

| Secret | Where to find it | Used by |
| --- | --- | --- |
| `SUPABASE_DEV_URL` | Project URL, `https://<ref>.supabase.co` (shown on the project home page and in the Connect dialog) | integration tests |
| `SUPABASE_DEV_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable key | integration tests |
| `SUPABASE_DEV_SECRET_KEY` | Project Settings → API Keys → secret key (create one named `ci`) | integration tests |
| `SUPABASE_DEV_PROJECT_REF` | The `<ref>` part of the project URL | migrate workflow |
| `SUPABASE_DEV_DB_PASSWORD` | Saved when the project was created | migrate workflow |
| `SUPABASE_ACCESS_TOKEN` | Account → Access Tokens (create one named `wakati-ci`) | migrate workflow |

Environment protection: keep "No restriction" under deployment branches for now, because
the integration tests run on pull requests. Only people with write access can open pull
requests from branches of this repository, and fork pull requests never receive these
secrets.

For local development, copy `.env.example` to `.env.local` and set the URL and publishable
key. Never commit `.env.local`.

## 6. Apply the schema

From GitHub (recommended): **Actions → Apply migrations to Supabase DEVELOPMENT → Run
workflow**.

1. First run: `dry_run = true`, `include_seed = true`. Check that the log lists the pending
   migrations, and download the schema snapshot artifact if you want it.
2. Second run: `dry_run = false`, `include_seed = true`.
3. The CI job `Hosted Supabase development project` then runs the integration tests against
   the project on every pull request. You can also re-run the latest CI workflow by hand.

From a developer machine with the Supabase CLI (equivalent):

```bash
npx supabase login
npx supabase link --project-ref <dev-project-ref>
npx supabase migration list --remote
npx supabase db push --remote --dry-run --include-seed
npx supabase db push --remote --include-seed
```

In CLI v3, `db push` and `migration list` target the **local** database unless `--remote`
is passed.

## 7. Migration safety and rollback

Rules for every migration:

- **Forward-only and additive.** Never edit a migration that has been applied anywhere;
  fix it with a new, later migration (as `20261124000200_fix_verification_guard.sql` does).
- **Tested before it reaches a hosted project.** Every PR applies all migrations to PGlite
  and to a real local Supabase stack in CI. Run the migrate workflow as a dry run first.
- **Grants are explicit.** A new table, sequence or function is **private** until its
  migration grants access: `20261124000400_revoke_default_api_grants.sql` removed Supabase's
  automatic grants and changed the default privileges for tables created by migrations. This
  applies whatever the dashboard's "automatically expose new tables" setting says. PGlite
  tests run both with and without hosted default grants.
- **The seed upserts reference data.** Re-running it overwrites category and city names
  with the values in `src/lib/reference`. Once staff edit reference data in the dashboard,
  run the workflow with `include_seed = false`.

Backups: **Free-plan projects get no automatic backups.** Before applying migrations to a
project that holds data you care about, take your own dump on a trusted machine:

```bash
npx supabase db dump --remote -f backup-schema.sql
npx supabase db dump --remote --data-only -f backup-data.sql   # contains user data: keep private
```

The migrate workflow also uploads a **schema-only** snapshot (`pre-migration-schema-<run>`)
before each run, kept for 14 days.

Rolling back, in order of preference:

1. **Roll forward:** write a new migration that reverses the change (for example
   `create or replace function` with the previous body, or `drop policy` + `create policy`).
   Test it in CI like any migration. This keeps history linear and works everywhere.
2. **Development project only:** reset to a clean state and re-apply everything with
   `npx supabase db reset --remote`. This **destroys all data in the dev project**, including
   test users. Never run it against production.
3. **Restore a dump** taken before the change (`psql "<connection string>" -f backup-…sql`)
   into a fresh project.

Rollback notes for the current migrations:

| Migration | Reverse with |
| --- | --- |
| `20261123000100_foundation` | Development: full reset. It creates every table, so there is no partial rollback. |
| `20261123000200_storage` | Drop the six storage policies; empty and delete the two buckets. |
| `20261124000100_api_grants_and_signup` | `drop trigger on_auth_user_created on auth.users;` (the grants can stay: they only allow what RLS permits) |
| `20261124000200_fix_verification_guard` | Not recommended: the previous body is broken. |
| `20261124000300_harden_listing_guard` | Re-create the function body and the `owners manage listing images` policy from `20261123000100_foundation` |
| `20261124000400_revoke_default_api_grants` | Not recommended (it only removes access). If needed: `alter default privileges for role postgres in schema public grant all on tables to anon, authenticated;` |

## 8. Development vs production

| | Development (now) | Production (later, separate approval) |
| --- | --- | --- |
| Supabase project | `wakati-dev`, Free plan | A **separate** project. Never reuse the dev project, and never point dev tooling at it |
| GitHub environment | `development` | `production`, with required reviewers and restricted to `main` |
| Secrets | `SUPABASE_DEV_*` | `SUPABASE_PROD_*`; no workflow in this repository references them yet |
| Migrations | Manual workflow, dry run first | A separate, reviewer-gated workflow, after a fresh backup |
| Integration tests | Run on every PR (create and delete test users) | **Never** run against production |
| Seed | Allowed | Run once at setup, then `include_seed = false` |
| Email | Built-in (team only) or test SMTP | Custom SMTP on a verified domain |
| Site URL / redirects | `http://localhost:3000/...` | The production domain only |

Nothing in this repository can reach a production project today: the only Supabase
credentials CI reads are the `SUPABASE_DEV_*` secrets in the `development` environment.

## 9. First admin

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
for those. Against the hosted project the tests **never send email**: hosted Supabase
rejects the reserved `example.com` domain, its built-in email allows only 2 messages per hour,
and that budget is needed for manual testing. The sign-up test there creates the same
unconfirmed user through the admin API. The public sign-up endpoint (with a real
confirmation email to the local mail catcher) is tested on every pull request against the
local Supabase stack (`SUPABASE_TEST_PUBLIC_SIGNUP=1`).
If a run is cancelled
midway, leftover `wakati.ci+…@example.com` users can be deleted under Authentication →
Users.
