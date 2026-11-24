#!/usr/bin/env node
/**
 * End-to-end smoke tests for a running Wakati deployment.
 *
 *   node scripts/ci/app-smoke.mjs seed       # create a test seller + published listing (before building)
 *   node scripts/ci/app-smoke.mjs check      # live listing data renders (needs `seed` before the build)
 *   node scripts/ci/app-smoke.mjs platform   # works on ANY deployment, incl. the Cloudflare preview:
 *                                            #   pages in EN/FR, noindex, preview banner, auth callback,
 *                                            #   and a concurrency check for hanging requests
 *   node scripts/ci/app-smoke.mjs load       # CPU-limit probe: sequential requests to dynamic pages
 *   node scripts/ci/app-smoke.mjs cleanup    # delete the test users (cascades to listings)
 *
 * Env:
 *   SUPABASE_TEST_URL, SUPABASE_TEST_SECRET_KEY   Supabase DEVELOPMENT project (or local stack)
 *   APP_URL                                       default http://localhost:3000
 *   CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET  optional Cloudflare Access service token
 *   EXPECT_PREVIEW_BANNER=1                       assert the development preview banner is shown
 */
import { createClient } from "@supabase/supabase-js";

const [command] = process.argv.slice(2);
const url = process.env.SUPABASE_TEST_URL;
const serviceKey = process.env.SUPABASE_TEST_SECRET_KEY;
const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const marker = process.env.SMOKE_MARKER ?? "wakatismoke";
const sellerEmail = `wakati.ci+smoke.${marker}@example.com`;
const authEmail = `wakati.ci+callback.${marker}@example.com`;

if (!url || !serviceKey) {
  console.error("SUPABASE_TEST_URL and SUPABASE_TEST_SECRET_KEY are required.");
  process.exit(1);
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const title = `Smoke test generator ${marker}`;

/** Cloudflare Access service-token headers, when testing a protected preview. */
const accessHeaders =
  process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
    ? { "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID, "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET }
    : {};

async function request(path, { redirect = "follow", timeoutMs = 20_000 } = {}) {
  const response = await fetch(appUrl + path, {
    redirect,
    headers: accessHeaders,
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { status: response.status, headers: response.headers, html: redirect === "manual" ? "" : await response.text() };
}

const failures = [];
const fail = (message) => failures.push(message);
function finish(success) {
  if (failures.length) {
    console.error("Smoke test failures:\n" + failures.map((f) => ` - ${f}`).join("\n"));
    process.exit(1);
  }
  console.log(success);
}

async function expectPage(path, needles = [], forbidden = []) {
  const { status, html, headers } = await request(path);
  if (status !== 200) fail(`${path}: HTTP ${status}`);
  for (const n of needles) if (!html.includes(n)) fail(`${path}: missing "${n}"`);
  for (const n of forbidden) if (html.includes(n)) fail(`${path}: unexpected "${n}"`);
  console.log(`${path} → ${status}`);
  return { html, headers };
}

async function findUser(email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === email);
}

async function seed() {
  const { data, error } = await admin.auth.admin.createUser({
    email: sellerEmail,
    password: `Smoke-${marker}-2026`,
    email_confirm: true,
    user_metadata: { display_name: "Smoke Seller" },
  });
  if (error) throw error;
  const [{ data: category }, { data: city }] = await Promise.all([
    admin.from("categories").select("id").eq("slug", "appliances").single(),
    admin.from("cities").select("id").eq("slug", "bamenda").single(),
  ]);
  const insert = await admin.from("listings").insert({
    seller_id: data.user.id,
    category_id: category.id,
    city_id: city.id,
    slug: `smoke-${marker}`,
    title,
    description: "Smoke test listing created by CI. Deleted at the end of the run.",
    price_xaf: 185000,
    is_negotiable: true,
    status: "published",
  });
  if (insert.error) throw insert.error;
  console.log(`Seeded listing "${title}"`);
}

async function check() {
  const devNotice = "listing database is not connected";
  await expectPage("/en", [title, "185,000", "Bamenda", "Latest listings"], [devNotice, "No listings yet"]);
  await expectPage("/fr", [title, "185 000", "Dernières annonces"]);
  await expectPage(`/en/search?q=${marker}`, [title, "1 listing"]);
  await expectPage("/fr/c/home-garden", [title]);
  await expectPage("/en/c/cars", ["No listings yet"], [title]);
  await expectPage(`/en/search?q=${marker}&city=douala`, ["No listings match your search"], [title]);
  finish("App renders live Supabase data correctly.");
}

async function platform() {
  // 1. Pages and languages, served from the real backend (never the reference fallback).
  const home = await expectPage("/en", ["Find what you need. Sell what you don't.", "Popular categories"], [
    "listing database is not connected",
  ]);
  await expectPage("/fr", ["Trouvez ce qu'il vous faut.", "Catégories populaires"]);
  await expectPage("/fr/c/vehicles", ["Voitures"]);
  await expectPage("/en/search?q=generator&city=bamenda", ["in Bamenda"]);
  await expectPage("/en/legal/terms", ["Draft – pending legal review"]);
  const root = await request("/", { redirect: "manual" });
  if (![307, 308].includes(root.status) || !/\/(en|fr)$/.test(root.headers.get("location") ?? "")) {
    fail(`/: expected a locale redirect, got ${root.status} ${root.headers.get("location")}`);
  }

  // 2. Never indexable outside production.
  const robots = await request("/robots.txt");
  if (!/Disallow: \/\s*$/m.test(robots.html)) fail(`robots.txt does not disallow everything:\n${robots.html}`);
  if (!/noindex/i.test(home.headers.get("x-robots-tag") ?? "")) fail("missing X-Robots-Tag: noindex header");
  if (!/<meta name="robots" content="noindex/.test(home.html)) fail("missing robots noindex meta tag");
  if (process.env.EXPECT_PREVIEW_BANNER === "1" && !home.html.includes("Development preview")) {
    fail("development preview banner is not shown");
  }

  // 3. Supabase email-link callback: success, invalid link, expired link.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: authEmail,
    password: `Callback-${marker}-2026`,
    options: { data: { display_name: "Callback Smoke" } },
  });
  if (error) throw error;
  const ok = await request(
    `/en/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=signup`,
    { redirect: "manual" },
  );
  const cookies = ok.headers.getSetCookie?.() ?? [];
  if (ok.status !== 303 || !ok.headers.get("location")?.endsWith("/en/auth/confirmed")) {
    fail(`callback success: expected 303 → /en/auth/confirmed, got ${ok.status} ${ok.headers.get("location")}`);
  }
  if (!cookies.some((c) => /^sb-[^=]+-auth-token/.test(c))) fail("callback success: no Supabase session cookie set");
  const confirmed = await admin.auth.admin.getUserById(data.user.id);
  if (!confirmed.data.user?.email_confirmed_at) fail("callback success: email not confirmed in Supabase");

  const reused = await request(
    `/en/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=signup`,
    { redirect: "manual" },
  );
  if (!reused.headers.get("location")?.includes("/en/auth/error?reason=")) fail("callback: a used link was accepted twice");
  const expired = await request("/fr/auth/callback?error=access_denied&error_code=otp_expired", { redirect: "manual" });
  if (!expired.headers.get("location")?.endsWith("/fr/auth/error?reason=expired")) fail("callback: expired link not reported");
  const evil = await request("/en/auth/callback?token_hash=x&type=signup&next=https://evil.example", { redirect: "manual" });
  if (evil.headers.get("location")?.includes("evil.example")) fail("callback: open redirect");
  await expectPage("/fr/auth/error?reason=expired", ["Le lien a expiré"]);
  console.log("auth callback → ok");

  // 4. Concurrency: parallel requests must all complete (guards against request hangs
  //    in cached rendering on Workers, see docs/CLOUDFLARE.md "Known risks").
  const paths = ["/en", "/fr", "/en/search?q=moto", "/fr/c/property", "/en", "/fr/search?city=douala"];
  const started = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: 24 }, (_, i) => request(paths[i % paths.length], { timeoutMs: 15_000 })),
  );
  const bad = results.filter((r) => r.status === "rejected" || r.value.status !== 200);
  if (bad.length) fail(`concurrency: ${bad.length}/24 requests failed or timed out`);
  console.log(`concurrency → ${24 - bad.length}/24 ok in ${Date.now() - started} ms`);

  finish("Deployment checks passed.");
}

/**
 * CPU-limit probe for the Workers Free plan (10 ms CPU per request). Sends sequential
 * requests to the pages that render request-specific content and fails on any error
 * response, including Cloudflare error 1102 ("Worker exceeded resource limits").
 */
async function load() {
  const rounds = Number(process.env.LOAD_ROUNDS ?? 15);
  const paths = ["/en/search?q=moto&city=douala", "/fr/c/vehicles", "/en/c/property?page=2", "/fr/auth/error?reason=invalid", "/en"];
  for (const path of paths) {
    const statuses = {};
    const times = [];
    for (let i = 0; i < rounds; i++) {
      const started = Date.now();
      try {
        const { status, html } = await request(`${path}${path.includes("?") ? "&" : "?"}probe=${i}`, { timeoutMs: 15_000 });
        times.push(Date.now() - started);
        const key = /error code:? 1102|exceeded resource limits/i.test(html) ? "1102" : String(status);
        statuses[key] = (statuses[key] ?? 0) + 1;
      } catch {
        statuses.timeout = (statuses.timeout ?? 0) + 1;
      }
    }
    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length / 2)] ?? 0;
    const p95 = times[Math.floor(times.length * 0.95)] ?? 0;
    console.log(`${path.padEnd(34)} ${JSON.stringify(statuses)} p50=${p50}ms p95=${p95}ms`);
    const bad = Object.entries(statuses).filter(([k]) => k !== "200");
    if (bad.length) fail(`${path}: ${JSON.stringify(Object.fromEntries(bad))} of ${rounds}`);
  }
  finish(`CPU-limit probe passed (${rounds} sequential requests per page, no 1102 or 5xx).`);
}

async function cleanup() {
  for (const email of [sellerEmail, authEmail]) {
    const user = await findUser(email);
    if (user) await admin.auth.admin.deleteUser(user.id);
  }
  console.log("Deleted smoke-test users (and their listings).");
}

const commands = { seed, check, platform, load, cleanup };
if (!commands[command]) {
  console.error("Usage: app-smoke.mjs seed|check|platform|load|cleanup");
  process.exit(1);
}
await commands[command]();
