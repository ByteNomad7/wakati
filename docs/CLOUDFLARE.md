# Cloudflare development preview

Wakati's **development preview** runs on Cloudflare Workers, deployed automatically from
GitHub, private behind Cloudflare Access, connected only to the Supabase **development**
project, and never indexed by search engines.

| | URL | Updated |
| --- | --- | --- |
| Main development preview | `https://wakati-dev.<account>.workers.dev` | Every push/merge to `main` |
| Branch / pull-request Preview | `https://<branch>-wakati-dev.<account>.workers.dev` | Every push to that branch (stable URL, posted on the PR) |

`<account>` is your account's workers.dev subdomain (Workers & Pages → Overview).

Production is **not** part of this setup. It will be a separate Worker with its own
Supabase project, domain and approval (see "Development vs production" in
docs/SUPABASE.md).

## 1. Architecture decision

**Cloudflare Workers + the OpenNext adapter (`@opennextjs/cloudflare`)**, built and deployed
by **Workers Builds** (Cloudflare's Git integration).

| Option | Verdict |
| --- | --- |
| Cloudflare Pages (`@cloudflare/next-on-pages`) | **Not suitable.** It requires the Edge runtime for every route and is no longer the recommended path for Next.js. Wakati uses Next.js 16.4 with Cache Components, `proxy.ts` (Node.js runtime) and Node APIs. |
| Cloudflare Workers + OpenNext | **Chosen.** Supports Next.js 16 (App Router, SSR, SSG, Route Handlers, `use cache`), with experimental support for `proxy.ts`. Workers Builds gives automatic production deploys plus per-branch Previews with PR comments. |

What was verified locally in `workerd` (Cloudflare's runtime) before this was written:

- **Size:** the build fits the Free plan, at about 1.8 MiB compressed against the 3 MiB limit. CI prints the size on every PR.
- **Routes:** every route type works in EN and FR (home, category, search, legal, auth pages, the 404 page, `robots.txt`, sitemap, manifest, brand assets), and so do the `/` → `/en|fr` locale redirect and the language switcher.
- **Layout:** no horizontal overflow at 390 px, 820 px or 1440 px.
- **Live data and auth:** CI now runs the same smoke tests against the Worker in workerd with a real Supabase stack. That covers live listings, noindex, the preview banner, the auth callback (success, reused link, expired link, open-redirect attempt) and 24 parallel requests.

## 2. What is in the repository

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker `wakati-dev`: assets, R2 cache, Durable Object queue, workers.dev + preview URLs, and a `previews` block for branch Previews |
| `open-next.config.ts` | OpenNext caching: R2 incremental cache with a regional cache, plus a Durable Object revalidation queue |
| `public/_headers` | Long-lived caching for hashed `/_next/static/*` files |
| `.node-version` | Node 22 for the build image |
| `package.json` | `cf:build`, `cf:preview` (local workerd), `cf:deploy`, `cf:typegen`; `overrides` (see Known risks) |
| `.github/workflows/ci.yml` | On every PR: OpenNext build, size report, and smoke tests in workerd with a real Supabase stack |
| `.github/workflows/preview-check.yml` | Manual: verifies the **deployed** preview through Cloudflare Access |
| `src/app/[lang]/auth/callback/route.ts` | Supabase email-link callback (needed to verify redirect URLs) |

## 3. Security model

- **Only public values reach the browser.** The app needs exactly two Supabase values:
  the project URL and the **publishable** key, which RLS protects. Both are `NEXT_PUBLIC_*`
  build variables.
- **Never add a Supabase secret key, service-role key, database password or access token to
  Cloudflare.** The app does not need them. They exist only as GitHub `development`
  environment secrets, used by CI.
- **Cloudflare Access** protects both the main workers.dev URL and all Preview URLs. Visitors
  must sign in (one-time PIN to an allowed email address). CI uses an Access **service
  token**.
- **No indexing.** The app is noindex unless `NEXT_PUBLIC_DEPLOYMENT_ENV=production`, which
  is never set here:
  - `robots.txt` contains `Disallow: /`;
  - every response carries `X-Robots-Tag: noindex, nofollow, noarchive`;
  - every page has `<meta name="robots" content="noindex, nofollow">`.

  Access also blocks crawlers, and Cloudflare adds `X-Robots-Tag: noindex` to workers.dev
  Preview URLs.
- **Visible banner:** "Development preview · test data only · not public" (EN/FR).
- **Development data only:** the build variables point at the Supabase development project,
  and nothing references production credentials.

## 4. Free tier

| Service | Used for | Plan |
| --- | --- | --- |
| Workers (Free) | The app | 100,000 requests/day, **10 ms CPU per request**, 3 MiB compressed size |
| Workers Builds | CI/CD from GitHub | Included build minutes |
| R2 | Next.js data cache | Free allowance (10 GB). Cloudflare may ask you to add a payment method to activate R2; nothing is charged within the free allowance |
| Durable Objects (SQLite) | Revalidation queue | Available on Workers Free |
| Zero Trust / Access | Private previews | Free plan, up to 50 users. Activation may ask for a payment method |

**CPU-time risk.** Measured on the production Node build, warm requests used about **3–8 ms**
CPU for the homepage and legal pages, and about **19–31 ms** for pages that render
request-specific content (category, search, auth). The Free plan stops a request after 10 ms
of CPU, and Cloudflare returns **error 1102**. Expect category and search pages to fail
intermittently or consistently on the Free plan. The preview check (section 8) detects this.
If it does, the fix is **Workers Paid (US$5/month)**, which raises the limit to 30 s by
default. That is your decision; nothing in this repository activates it.

## 5. One-time setup (owner)

Do these in order. Nothing here needs a secret to be shared in chat or committed.

### 5.1 Cloudflare account

1. Sign in at dash.cloudflare.com (a free account is enough).
2. **Workers & Pages → Overview:** note your workers.dev subdomain (`<account>`).

### 5.2 R2 bucket for the Next.js cache

1. **R2 Object Storage → Overview:** activate R2 if asked.
2. **Create bucket:** name it `wakati-dev-next-cache` and leave the location on Automatic.
3. Optional: under **Settings → Object lifecycle rules**, delete objects older than 30 days.
   Cache entries are stored per build, so old builds accumulate.

### 5.3 Connect GitHub (Workers Builds)

1. **Workers & Pages → Create → Import a repository → GitHub:** authorise the **Cloudflare
   Workers and Pages** GitHub app. Give it access to **only** `ByteNomad7/wakati`.
2. Select `ByteNomad7/wakati` and configure:

   | Setting | Value |
   | --- | --- |
   | Project / Worker name | `wakati-dev` (must match `wrangler.jsonc`) |
   | Production branch | `main` |
   | Build command | `npm run cf:build` |
   | Deploy command | `npx opennextjs-cloudflare deploy` |
   | Root directory | `/` (leave empty) |

3. **Build variables** (Settings → Build → Variables and secrets; available to the build only):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase **development** project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase **development** publishable key (`sb_publishable_…`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://wakati-dev.<account>.workers.dev` |
   | `NEXT_PUBLIC_DEPLOYMENT_ENV` | `development` |
   | `NODE_VERSION` | `22` |

   Leave the Worker's runtime **Variables and Secrets** empty. `wrangler.jsonc` sets the only
   runtime variable (`WAKATI_DEPLOY_ENV`).

4. Save and deploy. The first build takes a few minutes. Open the main URL. It will be
   public until step 5.5, so do that next.

### 5.4 Branch and pull-request Previews

**Settings → Build → Branch control:**

1. Production branch: `main`.
2. Tick **Enable Preview Builds**. If the Worker shows a "Set up Worker Previews" banner,
   complete it: the bindings for Previews are already declared in the `previews` block of
   `wrangler.jsonc`.
3. **Preview command:**
   `npx opennextjs-cloudflare populateCache remote && npx wrangler preview`
   This uploads the branch's prerendered pages to the cache, then creates or updates that
   branch's Preview. Cloudflare comments the Preview URL on the pull request.

### 5.5 Make the preview private (Cloudflare Access)

Cloudflare's Worker-level Access interface (introduced August 2026) protects every hostname of
one Worker with a single setting: the workers.dev URL, branch Preview URLs and any future
custom domain.

1. **Zero Trust:** complete the one-time setup if asked (choose the **Free** plan, up to 50
   users).
2. **Workers & Pages → wakati-dev → Access** tab → **Protect this Worker behind Access**.
   - Traffic scope: **All traffic** (production and previews). "Previews only" would leave the
     main development URL public.
   - Do **not** use the account-wide **Protect all Workers** card for this project (see
     "Cache population and Access" below).
3. Policies attached to the Worker (a visitor matching **any** policy is let in):

   | Policy | Action | Include | Purpose |
   | --- | --- | --- | --- |
   | `Wakati Authorised Reviewers` | Allow | Emails: the reviewers' addresses; login: One-time PIN | People who review previews |
   | `Wakati CI Service Access` | Service Auth | Service Token: `wakati-ci` | GitHub Actions preview check |
   | `Cloudflare account` (created by default) | Allow | Members of the Cloudflare account | Optional; can be removed (see below) |

   Create the service token first: Zero Trust → Access → Service credentials → Service Tokens
   → `wakati-ci`. Copy the Client ID and Secret once into GitHub (section 5.6).
4. **Check:** in a private window, `https://wakati-dev.<account>.workers.dev` must show the
   Cloudflare Access sign-in page, not Wakati.

**Removing the default "Cloudflare account" policy.** This is safe, and it tightens access:
- Policies are alternatives, so removing one can only reduce who gets in. Future members of the
  Cloudflare account would otherwise get preview access automatically.
- No automation uses it. Workers Builds deploys through the Cloudflare API, not the preview URL.
  The preview check uses the `wakati-ci` service token. OpenNext's cache upload uses its own
  helper Worker.

Before removing it, make sure every reviewer, including you, is listed in
`Wakati Authorised Reviewers`. Afterwards, sign in again from a private window to confirm.

**Cache population and Access.** On every deploy and Preview build, OpenNext's
`populateCache remote` starts a temporary helper Worker at
`open-next-cache-populate.<account>.workers.dev` and uploads prerendered pages through it. That
hostname is a different Worker, so Worker-level Access on `wakati-dev` does not affect it. If
account-wide **Protect all Workers** is ever enabled, these uploads would be blocked and builds
would fail. In that case, add the `wakati-ci` token to Workers Builds as **build secrets**
`CLOUDFLARE_ACCESS_CLIENT_ID` and `CLOUDFLARE_ACCESS_CLIENT_SECRET`; OpenNext sends them with
the uploads.

### 5.6 GitHub configuration for the preview check

In the repository, go to **Settings → Environments → `development`**:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `CF_ACCESS_CLIENT_ID` | Service token Client ID |
| Secret | `CF_ACCESS_CLIENT_SECRET` | Service token Client Secret |
| Variable | `WAKATI_PREVIEW_URL` | `https://wakati-dev.<account>.workers.dev` |

The Supabase development secrets from docs/SUPABASE.md must also be present.

### 5.7 Supabase redirect URLs (Authentication → URL Configuration)

| Setting | Value |
| --- | --- |
| Site URL | `https://wakati-dev.<account>.workers.dev` |
| Redirect URLs | `http://localhost:3000/*/auth/callback` |
| | `https://wakati-dev.<account>.workers.dev/*/auth/callback` |
| | `https://*-wakati-dev.<account>.workers.dev/*/auth/callback` |

In Supabase patterns, `*` never crosses `.` or `/`. So the third line matches only branch and
deployment Previews of this Worker on your own subdomain, and the leading `*` matches only
`en`/`fr`. Nobody else can create hostnames under your workers.dev subdomain.

## 6. Day-to-day workflow

1. Push a feature branch and open a pull request.
2. Workers Builds builds it and comments the branch Preview URL on the PR. GitHub Actions CI
   runs at the same time.
3. Review the Preview on desktop and phone (sign in through Access).
4. When CI is green and the Preview looks right, approve and merge. Merging deploys `main`
   to the main development preview.

To roll back the main preview: **Workers & Pages → wakati-dev → Deployments → (previous
version) → Rollback**. Database changes are not rolled back this way; see "Migration safety
and rollback" in docs/SUPABASE.md.

## 7. Environment variables reference

| Variable | Where | Secret? | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Workers Builds build variable | No | Supabase dev project URL (inlined at build) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Workers Builds build variable | No (public by design) | Supabase dev publishable key |
| `NEXT_PUBLIC_SITE_URL` | Workers Builds build variable | No | Canonical/OG base URL |
| `NEXT_PUBLIC_DEPLOYMENT_ENV` | Workers Builds build variable | No | `development` → noindex + preview banner |
| `NODE_VERSION` | Workers Builds build variable | No | Node 22 |
| `WAKATI_DEPLOY_ENV` | `wrangler.jsonc` `vars` | No | Label: `development-preview` / `development-branch-preview` |
| Supabase secret key, DB password, access token | **GitHub `development` environment only** | Yes | CI tests and migrations; **never** in Cloudflare |
| `CF_ACCESS_CLIENT_ID` / `_SECRET` | GitHub `development` environment | Yes | Preview check through Access |

`NEXT_PUBLIC_*` values are inlined into the JavaScript at build time, so changing them in
Cloudflare requires a new build (Deployments → Retry build, or push a commit).

## 8. Verification

After setup, and whenever you want to re-check, run **GitHub → Actions → Check Cloudflare
development preview → Run workflow**. Leave the URL blank for the main preview, or paste a
branch Preview URL (only `*.workers.dev` URLs are accepted). The workflow checks:

- **Access:** an unauthenticated request must not get the app (expects a redirect to sign-in).
- **Pages and languages:** EN/FR pages load from the live development database, including
  the locale redirect.
- **No indexing:** `robots.txt`, the `X-Robots-Tag` header, the robots meta tag, and the
  preview banner.
- **Auth callback:** a real confirmation link from Supabase confirms the user and sets the
  session cookie. A reused link and an expired link are rejected with a localized message,
  and `next=` cannot redirect off-site.
- **Concurrency:** 24 parallel requests across pages, each within 15 s. This catches the
  request-hang issue below.
- **CPU-limit probe:** 15 sequential requests to each dynamic page (search, category,
  paginated category, auth error) plus the homepage. It fails on any error response,
  including error 1102 ("Worker exceeded resource limits").

The check creates and deletes its own test users in the development project.

For CPU time over real traffic, see **Workers & Pages → wakati-dev → Metrics** (CPU time
percentiles, errors) and **Observability → Logs** (filter on outcome `exceededCpu`).

Visual review: open the preview on a phone and on a desktop. During setup, layouts at 390,
820 and 1440 px were checked in workerd with a headless browser (no horizontal overflow).
The deployed check covers behaviour, not pixels.

## 9. Known risks and limitations

| Item | Impact | Mitigation |
| --- | --- | --- |
| OpenNext marks `proxy.ts` (Node middleware) support as **experimental** | The locale redirect and cookie run through it | Covered by CI smoke tests in workerd on every PR |
| OpenNext bug: its middleware imported `cookie` v1 in a way that is `undefined` on Workers, so **every request with a cookie returned 500** (including Access's `CF_Authorization` cookie) | Would have broken the whole preview | `package.json` `overrides` gives `@opennextjs/aws` `cookie@0.7.2` (same `parse` API, compatible export). Only that package is affected; Supabase keeps `cookie@1`. Remove it when upstream fixes the import |
| OpenNext warns "Cache Components are not fully supported on Cloudflare yet" | Pages with streamed request-specific sections (category, search, auth error) log React error #419 in the browser console on Workers only. Content renders correctly, because React re-renders those sections in the browser | Accepted for the development preview; re-check on each OpenNext upgrade |
| Reported upstream: with Next 16.4 + Cache Components, `use cache` requests can hang on deployed Workers (not reproducible in `wrangler dev`; no fix released at time of writing) | Requests time out | The deployed preview check fires 24 parallel requests with a 15 s timeout. If it fails, report it before relying on the preview |
| Free plan 10 ms CPU limit | Category/search pages may return error 1102 | See section 4; Workers Paid is an owner decision |
| Branch Previews skip background revalidation (no self-referencing service binding, so a Preview can never call the main Worker) | Time-revalidated sections on a Preview show data as of that Preview's build or first render | Push a commit to refresh. Phase B's tag-based invalidation (`updateTag`) does not need the queue |
| Build log warning: "A DurableObjectNamespace in the config referenced the class DOQueueHandler, but no such Durable Object class is exported" | None for the deployed Worker | Comes from OpenNext's temporary cache-upload helper Worker, which reads `wrangler.jsonc` but has its own entrypoint. The deployed `.open-next/worker.js` exports `DOQueueHandler`, and Wrangler resolves the binding. Reproduced locally with `opennextjs-cloudflare populateCache local` |
| `npm audit`: 3 moderate (`glob` ≤14.0.1 and `minimatch` <11.0.1, via `@opennextjs/cloudflare`) | Build-time only: used by the OpenNext CLI on our own repository files; none of this code is in the deployed Worker | Do **not** run `npm audit fix --force` (it would downgrade OpenNext to 0.3.0). Upgrade when OpenNext releases a version on `glob` ≥14.0.2 |
| No Cloudflare Images binding yet | `next/image` optimisation of remote listing photos is not configured | Decided in Phase B together with photo uploads |
| Unknown-slug pages return HTTP 200 with a 404 page (Phase A limitation) | SEO only | noindex everywhere in development |
