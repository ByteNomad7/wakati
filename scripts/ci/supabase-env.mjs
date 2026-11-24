#!/usr/bin/env node
/**
 * Reads the running LOCAL Supabase stack's URL and API keys (`supabase status`) and
 * exports them for later CI steps via $GITHUB_ENV. These are the CLI's local
 * development keys, not project secrets, but they are still masked in logs.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const raw = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8" });
const env = Object.fromEntries(
  raw
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const apiUrl = env.API_URL;
// Prefer the new key types (what hosted projects issue); fall back to legacy JWT keys.
const publishableKey = env.PUBLISHABLE_KEY || env.ANON_KEY;
const secretKey = env.SECRET_KEY || env.SERVICE_ROLE_KEY;
if (!apiUrl || !publishableKey || !secretKey) {
  console.error("Could not read API_URL / PUBLISHABLE_KEY / SECRET_KEY from `supabase status`. Keys found:", Object.keys(env));
  process.exit(1);
}

const out = {
  SUPABASE_TEST_URL: apiUrl,
  SUPABASE_TEST_PUBLISHABLE_KEY: publishableKey,
  SUPABASE_TEST_SECRET_KEY: secretKey,
  NEXT_PUBLIC_SUPABASE_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
};

for (const key of [publishableKey, secretKey]) console.log(`::add-mask::${key}`);
console.log(`Key types: ${publishableKey.startsWith("sb_publishable_") ? "publishable/secret" : "legacy JWT"}`);
const target = process.env.GITHUB_ENV;
if (target) {
  appendFileSync(target, Object.entries(out).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
  console.log(`Exported ${Object.keys(out).join(", ")} (API at ${apiUrl})`);
} else {
  console.log(`API at ${apiUrl}; set GITHUB_ENV to export variables.`);
}
