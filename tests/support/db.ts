import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const root = join(import.meta.dirname, "..", "..");

/** Fresh in-memory database with the shim, all migrations and the seed applied. */
export async function createTestDatabase(): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(readFileSync(join(root, "tests/support/supabase-shim.sql"), "utf8"));
  const dir = join(root, "supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  // Supabase grants table privileges to the API roles by default; RLS then decides.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
    grant usage, select on all sequences in schema public to anon, authenticated, service_role;
    grant select, insert, update, delete on all tables in schema storage to anon, authenticated, service_role;
  `);
  // Re-apply the migration's explicit revokes that the blanket grant above overrides.
  await db.exec(`revoke insert, update, delete on public.contact_reveals from anon, authenticated;`);
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

export async function createUser(db: PGlite, id: string, displayName: string) {
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, `${id}@example.test`]);
  await db.query(`insert into public.profiles (id, display_name) values ($1, $2)`, [id, displayName]);
}

export async function idOf(db: PGlite, table: "categories" | "cities", slug: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(`select id from public.${table} where slug = $1`, [slug]);
  if (!rows[0]) throw new Error(`${table} ${slug} not found`);
  return rows[0].id;
}
