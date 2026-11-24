#!/usr/bin/env node
/**
 * End-to-end smoke test: proves the production build reads REAL data from Supabase.
 *
 *   node scripts/ci/app-smoke.mjs seed      # create a test seller + published listing
 *   (start `next start` with NEXT_PUBLIC_SUPABASE_* pointing at the same project)
 *   node scripts/ci/app-smoke.mjs check     # fetch pages and assert the listing renders
 *   node scripts/ci/app-smoke.mjs cleanup   # delete the test seller (cascades)
 *
 * Env: SUPABASE_TEST_URL, SUPABASE_TEST_SECRET_KEY, APP_URL (default http://localhost:3000)
 */
import { createClient } from "@supabase/supabase-js";

const [command] = process.argv.slice(2);
const url = process.env.SUPABASE_TEST_URL;
const serviceKey = process.env.SUPABASE_TEST_SECRET_KEY;
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const marker = process.env.SMOKE_MARKER ?? "wakatismoke";
const email = `wakati.ci+smoke.${marker}@example.com`;

if (!url || !serviceKey) {
  console.error("SUPABASE_TEST_URL and SUPABASE_TEST_SECRET_KEY are required.");
  process.exit(1);
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const title = `Smoke test generator ${marker}`;

async function findUser() {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === email);
}

async function seed() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
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

async function fetchText(path) {
  const response = await fetch(appUrl + path, { redirect: "follow" });
  return { status: response.status, html: await response.text() };
}

async function check() {
  const failures = [];
  const expectPage = async (path, needles, forbidden = []) => {
    const { status, html } = await fetchText(path);
    if (status !== 200) failures.push(`${path}: HTTP ${status}`);
    for (const n of needles) if (!html.includes(n)) failures.push(`${path}: missing "${n}"`);
    for (const n of forbidden) if (html.includes(n)) failures.push(`${path}: unexpected "${n}"`);
    console.log(`${path} → ${status}`);
  };
  const devNotice = "listing database is not connected";
  await expectPage("/en", [title, "185,000", "Bamenda", "Latest listings"], [devNotice, "No listings yet"]);
  await expectPage("/fr", [title, "185 000", "Dernières annonces"]);
  await expectPage(`/en/search?q=${marker}`, [title, "1 listing"]);
  await expectPage("/fr/c/home-garden", [title]);
  await expectPage("/en/c/cars", ["No listings yet"], [title]);
  await expectPage(`/en/search?q=${marker}&city=douala`, ["No listings match your search"], [title]);
  if (failures.length) {
    console.error("Smoke test failures:\n" + failures.map((f) => ` - ${f}`).join("\n"));
    process.exit(1);
  }
  console.log("App renders live Supabase data correctly.");
}

async function cleanup() {
  const user = await findUser();
  if (user) await admin.auth.admin.deleteUser(user.id);
  console.log(user ? "Deleted smoke-test seller and listing." : "Nothing to clean up.");
}

const commands = { seed, check, cleanup };
if (!commands[command]) {
  console.error("Usage: app-smoke.mjs seed|check|cleanup");
  process.exit(1);
}
await commands[command]();
