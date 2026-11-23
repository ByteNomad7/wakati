/**
 * Generates supabase/seed.sql from the TypeScript reference data so there is a
 * single source for launch categories and locations.
 *
 *   npm run db:seed:generate   # write the file
 *   npm test                   # fails if the committed seed is out of date
 *
 * The seed is idempotent (upserts by slug) and safe to re-run.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSeedSql } from "../src/lib/reference/seed-sql";

const target = resolve(import.meta.dirname, "../supabase/seed.sql");
writeFileSync(target, buildSeedSql());
console.log(`Wrote ${target}`);
