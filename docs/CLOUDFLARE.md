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
| Cloudflare Pages (`@cloudflare/next-on-pages`) | **Not suitable.** It requires the Edge runtime for every route and is no longer the recommended path for Next.js. Wakati uses Next.js 16.4 with `proxy.ts` (Node.js runtime) and Node APIs. |
| Cloudflare Workers + OpenNext | **Chosen.** Supports Next.js 16 (App Router, SSR, SSG, Route Handlers), with experimental support for `proxy.ts`. Workers Builds gives automatic production deploys plus per-branch Previews. Wakati runs **without Cache Components**, which failed on deployed Workers (section 10). |

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

**Resource limits (confirmed on the deployed Preview, see section 10).** Every Worker
isolate has **128 MB of memory on both Free and Paid plans**, and 10 ms CPU per request on
Free. Live-data pages now render on every request. Under repeated requests the deployed
Worker returns **error 1102 ("Worker exceeded resource limits")** after roughly 40–50
requests per isolate, until Cloudflare starts a fresh isolate. Cloudflare's logs say which
limit was hit: Workers & Pages → wakati-dev → Observability → filter by outcome
`exceededCpu` or `exceededMemory`. That classification decides the fix: Workers Paid
(US$5/month, owner decision, not activated) raises the CPU limit but **not** the memory
limit.

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

**A change that affects the Worker is merged only after its branch Preview passes the
deployed check.** Local runtimes (`wrangler dev`/workerd, `next start`) do not enforce
Cloudflare's CPU and memory limits, and the Cache Components failure (section 10) never
appeared locally.

| Layer | Runs | What it proves |
| --- | --- | --- |
| CI `supabase-local` | Every PR | Against a real Supabase stack, in **both** `next start` and workerd: live data, `platform`, `fresh`, `load` (5 rounds) |
| CI `supabase-dev` | Every PR | 23 integration tests against the hosted development project |
| **Check Cloudflare development preview** | Manual, required before merging Worker changes | The same checks against the **deployed** Worker, through Access |

Run it from **GitHub → Actions → Check Cloudflare development preview → Run workflow**.
Choose the PR's branch and paste its Preview URL, or leave the URL blank for the main
preview. Each step runs even if an earlier one fails, so one run shows every problem:

1. **Access:** an unauthenticated request must be redirected to sign-in.
2. **`platform`:**
   - EN/FR home, category, search and legal pages load, with their result sections present;
   - unknown categories return a real HTTP 404;
   - live pages are not publicly cacheable;
   - noindex (robots, header, meta) and the preview banner;
   - the auth callback (success, reused link, expired link, open-redirect attempt);
   - 24 parallel requests.
3. **`load`:** 15 sequential requests to each dynamic page (search, category, paginated
   category, auth error, home). It fails on any 5xx, error **1102**, or a response missing
   its result section.
4. **`fresh`:** a listing created **after** the deployment must appear immediately on
   home, search and category pages in EN and FR, and must disappear immediately once
   archived. This replaces "wait for the cache to expire" tests: live pages no longer
   depend on any cache expiring.

The check creates and deletes its own test users in the development project.

For CPU time and memory over real traffic, see **Workers & Pages → wakati-dev → Metrics**
and **Observability** (outcomes `exceededCpu`, `exceededMemory`).

Visual review: open the preview on a phone and on a desktop. During setup, layouts at 390,
820 and 1440 px were checked in workerd with a headless browser (no horizontal overflow).

## 9. Known risks and limitations

| Item | Impact | Mitigation |
| --- | --- | --- |
| OpenNext marks `proxy.ts` (Node middleware) support as **experimental** | The locale redirect and cookie run through it | Covered by CI smoke tests in workerd on every PR |
| OpenNext bug: its middleware imported `cookie` v1 in a way that is `undefined` on Workers, so **every request with a cookie returned 500** (including Access's `CF_Authorization` cookie) | Would have broken the whole preview | `package.json` `overrides` gives `@opennextjs/aws` `cookie@0.7.2` (same `parse` API, compatible export). Only that package is affected; Supabase keeps `cookie@1`. Remove it when upstream fixes the import |
| Cache Components on deployed Workers (OpenNext #1450; fix #1318 unreleased) | **Confirmed:** homepage HTTP 500 after its prerendered copy expired; streamed search results silently missing | **Resolved by not using Cache Components** (section 10). Revisit only after an OpenNext release fixes it **and** the deployed check passes |
| Reported upstream: `use cache` request hangs on deployed Workers | Requests time out | No longer applicable (no `use cache`). The parallel-request check stays in place |
| **Error 1102 on the deployed Worker under repeated requests** (open) | After ~40–50 requests per isolate, requests fail until a new isolate starts | Under investigation; see sections 4 and 10. Blocks merging the compatibility refactor |
| Branch Previews skip background revalidation (no self-referencing service binding, so a Preview can never call the main Worker) | None today: no page uses time-based revalidation, and live-data pages render per request | Keep in mind if ISR is introduced later |
| Build log warning: "A DurableObjectNamespace in the config referenced the class DOQueueHandler, but no such Durable Object class is exported" | None for the deployed Worker | Comes from OpenNext's temporary cache-upload helper Worker, which reads `wrangler.jsonc` but has its own entrypoint. The deployed `.open-next/worker.js` exports `DOQueueHandler`, and Wrangler resolves the binding. Reproduced locally with `opennextjs-cloudflare populateCache local` |
| `npm audit`: 3 moderate (`glob` ≤14.0.1 and `minimatch` <11.0.1, via `@opennextjs/cloudflare`) | Build-time only: used by the OpenNext CLI on our own repository files; none of this code is in the deployed Worker | Do **not** run `npm audit fix --force` (it would downgrade OpenNext to 0.3.0). Upgrade when OpenNext releases a version on `glob` ≥14.0.2 |
| No Cloudflare Images binding yet | `next/image` optimisation of remote listing photos is not configured | Decided in Phase B together with photo uploads |
| Unknown-slug pages returned HTTP 200 with a 404 page (Phase A limitation) | SEO only | Fixed by the compatibility refactor: real HTTP 404 |

## 10. Incident: Cache Components on deployed Workers (24 November 2026)

**What happened.** The main development preview passed every check immediately after the
first deployment. About 40 minutes later:

- `/en` and `/fr` returned **HTTP 500** on every request (12 of 24 parallel requests failed:
  all of them homepage requests);
- on the branch Preview, the search page returned 200 **without its results section**
  ("in Bamenda" heading missing).

Category, search and legal pages otherwise worked. None of this appeared in `wrangler dev`,
workerd in CI or `next start`.

**Cause.** With Cache Components, the homepage was prerendered and served from the cache
until its entry expired. After that, each request rendered it live on the Worker, which
fails on deployed workerd. Request-time sections (Suspense) failed the same way, but
because they were streamed after HTTP 200 had been sent, the failure showed up as a
missing section instead of an error. This matches OpenNext issue #1450 (HTTP 500 with Cache
Components on Workers). The fix, PR #1318 ("run Cache Components staged renders correctly
on workerd"), was unmerged at the time. OpenNext's build also warns: "Cache Components are
not fully supported on Cloudflare yet".

**Compatibility refactor (separate PR).** Wakati no longer uses Cache Components:

- `cacheComponents` is off; no `"use cache"`, `cacheLife` or `cacheTag`. The Phase A UI,
  EN/FR routing (`next/root-params`), Supabase integration, auth, RLS and noindex behaviour
  are unchanged.
- **Home, category and search render on every request** with live listings (never cached)
  and `Cache-Control: private, no-store`.
- **Reference data** (categories, regions, cities): in-memory cache of 5 minutes per Worker
  instance, instead of the Next.js data cache.
- Results render **in the main response** (no Suspense streaming, no route-level
  `loading.tsx`). A failure is now a visible error, and unknown slugs return a real 404.
- `data-section` markers let tests confirm each live-data section is present.
- **Bug found by the new checks:** a results page beyond the last one (e.g.
  `/en/c/property?page=2`) crashed with PostgREST 416. Before, this was hidden in a
  streamed section; now it returns an empty page with the real total, covered by an
  integration test against real Supabase.

**Revised testing strategy.** See section 8. The deployed check is mandatory for Worker
changes. It includes `load` (repeated dynamic requests: 5xx, 1102 and missing sections) and
`fresh` (data changed after deployment must show immediately).

**Results on the branch Preview after the refactor.**

| Check | Result |
| --- | --- |
| Access, EN/FR pages, sections, 404, noindex, auth callback | Pass |
| 24 parallel requests | Pass (24/24, about 2 s) |
| `fresh` (create and archive after deployment) | Pass: new listing visible at once in EN/FR; archived listing gone at once |
| No HTTP 500, no missing sections | Pass |
| `load` (15 sequential requests per page) | **Fail: error 1102.** Run 1: home 7/15, auth error 4/15. Run 2: home 15/15, auth error 15/15, paginated category 2/15. Search and category always passed |

**Open issue: error 1102.** The failures start after roughly 40–50 requests on one isolate
and persist until a new isolate starts, rather than tracking page weight. Locally, after
about 700 requests the Worker's JavaScript heap was 83 MB used / 126 MB allocated before
garbage collection, and about 30 MB after it. So it is not a persistent leak, but the
allocated heap approaches the 128 MB isolate limit between collections. Next step:
classify the failures in Cloudflare Observability (`exceededMemory` or `exceededCpu`),
then reduce per-request memory/CPU or, for CPU only, consider Workers Paid (owner
decision).
