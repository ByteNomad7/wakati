import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, createTestDatabase } from "../support/db";

/**
 * Same migrations, but on a database that behaves like a hosted Supabase project
 * with "automatically expose new tables" ON (found by the hosted integration run).
 * Private tables must still be unreachable for anon, not merely empty.
 */
let db: PGlite;
beforeAll(async () => {
  db = await createTestDatabase({ hostedDefaults: true });
});
afterAll(async () => {
  await db?.close();
});

const privilege = async (role: string, table: string, priv: string) =>
  (await db.query<{ ok: boolean }>(`select has_table_privilege($1, $2, $3) as ok`, [role, table, priv])).rows[0].ok;

describe("with hosted default grants (auto-expose on)", () => {
  it.each(["seller_contacts", "user_settings", "user_roles", "account_restrictions", "audit_log", "contact_reveals", "reports", "saved_listings"])(
    "anon has no privilege at all on private table %s",
    async (table) => {
      for (const p of ["SELECT", "INSERT", "UPDATE", "DELETE"]) expect(await privilege("anon", `public.${table}`, p)).toBe(false);
    },
  );

  it("anon cannot even query seller contacts", async () => {
    await expect(as(db, { role: "anon" }, (tx) => tx.query("select * from public.seller_contacts"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("anon keeps exactly the read access the app needs", async () => {
    for (const t of ["categories", "cities", "regions", "public_listing_cards", "profiles", "listings"]) {
      expect(await privilege("anon", `public.${t}`, "SELECT"), t).toBe(true);
      expect(await privilege("anon", `public.${t}`, "INSERT"), t).toBe(false);
    }
  });

  it("authenticated users get no privileges beyond the explicit grants", async () => {
    expect(await privilege("authenticated", "public.contact_reveals", "INSERT")).toBe(false);
    expect(await privilege("authenticated", "public.audit_log", "UPDATE")).toBe(false);
    expect(await privilege("authenticated", "public.audit_log", "DELETE")).toBe(false);
    expect(await privilege("authenticated", "public.categories", "TRUNCATE")).toBe(false);
  });

  it("internal helper functions are not executable by anon", async () => {
    const { rows } = await db.query<{ ok: boolean }>(
      `select has_function_privilege('anon', 'public.is_restricted(uuid, public.restriction_kind[])', 'EXECUTE') as ok`,
    );
    expect(rows[0].ok).toBe(false);
  });

  it("future tables created by migrations are not auto-exposed", async () => {
    await db.exec("create table public.future_table (id int)");
    expect(await privilege("anon", "public.future_table", "SELECT")).toBe(false);
    expect(await privilege("authenticated", "public.future_table", "SELECT")).toBe(false);
    await db.exec("drop table public.future_table");
  });
});
