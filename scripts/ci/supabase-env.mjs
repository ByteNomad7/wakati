#!/usr/bin/env node
/**
 * Reads the running LOCAL Supabase stack's URL and keys (`supabase status`) and
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
const anonKey = env.ANON_KEY || env.PUBLISHABLE_KEY;
const serviceKey = env.SERVICE_ROLE_KEY || env.SECRET_KEY;
if (!apiUrl || !anonKey || !serviceKey) {
  console.error("Could not read API_URL / ANON_KEY / SERVICE_ROLE_KEY from `supabase status`. Keys found:", Object.keys(env));
  process.exit(1);
}

const out = {
  SUPABASE_TEST_URL: apiUrl,
  SUPABASE_TEST_ANON_KEY: anonKey,
  SUPABASE_TEST_SERVICE_ROLE_KEY: serviceKey,
  NEXT_PUBLIC_SUPABASE_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
};

for (const key of [anonKey, serviceKey]) console.log(`::add-mask::${key}`);
const target = process.env.GITHUB_ENV;
if (target) {
  appendFileSync(target, Object.entries(out).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
  console.log(`Exported ${Object.keys(out).join(", ")} (API at ${apiUrl})`);
} else {
  console.log(`API at ${apiUrl}; set GITHUB_ENV to export variables.`);
}
