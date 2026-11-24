import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const root = join(import.meta.dirname, "..", "..");

/**
 * Fresh in-memory database with the shim, all migrations and the seed applied.
 *
 * `hostedDefaults: true` emulates a hosted Supabase project with "automatically
 * expose new tables" ON: every new public table, sequence and function is granted
 * to anon/authenticated by default privileges before the migrations run.
 */
export async function createTestDatabase(options: { hostedDefaults?: boolean } = {}): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(readFileSync(join(root, "tests/support/supabase-shim.sql"), "utf8"));
  if (options.hostedDefaults) {
    await db.exec(`
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
      alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
    `);
  }
  const dir = join(root, "supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  // Only storage needs blanket grants here (Supabase manages that schema). Public-schema
  // privileges come exclusively from the migrations, so missing grants fail the tests.
  await db.exec(`grant select, insert, update, delete on all tables in schema storage to anon, authenticated, service_role;`);
  await db.exec(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
  return db;
}

/** Runs `fn` as a Supabase API role, rolled back afterwards unless `commit` is true. */
export async function as<T>(
  db: PGlite,
  who: { role: "anon" } | { role: "authenticated"; userId: string },
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${who.role}`);
    if (who.role === "authenticated") {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [who.userId]);
    }
    return fn(tx);
  });
}

/** Inserts an auth user; the sign-up trigger creates the profile and settings rows. */
export async function createUser(db: PGlite, id: string, displayName: string, preferredLanguage = "en") {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id,
    `${id}@example.test`,
    JSON.stringify({ display_name: displayName, preferred_language: preferredLanguage }),
  ]);
}

export async function idOf(db: PGlite, table: "categories" | "cities", slug: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(`select id from public.${table} where slug = $1`, [slug]);
  if (!rows[0]) throw new Error(`${table} ${slug} not found`);
  return rows[0].id;
}
