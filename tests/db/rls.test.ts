import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { as, createTestDatabase, createUser, idOf } from "../support/db";

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";
const MOD = "00000000-0000-4000-8000-0000000000aa";

let db: PGlite;
let cars: string;
let jobs: string;
let douala: string;

const listing = (overrides: Record<string, unknown> = {}) => ({
  seller_id: ALICE,
  category_id: cars,
  city_id: douala,
  slug: `test-${Math.random().toString(36).slice(2, 10)}`,
  title: "Test vehicle listing",
  description: "A description that is long enough for the check constraint.",
  price_xaf: 1_500_000,
  status: "published",
  ...overrides,
});

async function insertListing(userId: string, values: Record<string, unknown>) {
  const cols = Object.keys(values);
  return as(db, { role: "authenticated", userId }, async (tx) => {
    const { rows } = await tx.query<{ id: string; status: string; published_at: string | null }>(
      `insert into public.listings (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})
       returning id, status, published_at`,
      Object.values(values),
    );
    return rows[0];
  });
}

/** Inserts as a trusted server role and commits, for tests that need existing data. */
async function seedListing(values: Record<string, unknown>) {
  const cols = Object.keys(values);
  const { rows } = await db.query<{ id: string }>(
    `insert into public.listings (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
    Object.values(values),
  );
  return rows[0].id;
}

beforeAll(async () => {
  db = await createTestDatabase();
  await createUser(db, ALICE, "Alice");
  await createUser(db, BOB, "Bob");
  await createUser(db, MOD, "Moderator");
  await db.query(`insert into public.user_roles (user_id, role) values ($1, 'moderator')`, [MOD]);
  cars = await idOf(db, "categories", "cars");
  jobs = await idOf(db, "categories", "jobs");
  douala = await idOf(db, "cities", "douala");
});

afterAll(async () => {
  await db?.close();
});

describe("sign-up trigger", () => {
  it("creates a profile and settings row from the sign-up metadata", async () => {
    const id = "00000000-0000-4000-8000-0000000000f1";
    await createUser(db, id, "  Ngozi  ", "fr");
    const { rows } = await db.query<{ display_name: string; preferred_language: string; business_verification: string }>(
      `select p.display_name, s.preferred_language, p.business_verification
       from public.profiles p join public.user_settings s on s.user_id = p.id where p.id = $1`,
      [id],
    );
    expect(rows[0]).toEqual({ display_name: "Ngozi", preferred_language: "fr", business_verification: "unverified" });
  });

  it("never uses the email address as a public name", async () => {
    const id = "00000000-0000-4000-8000-0000000000f2";
    await db.query(`insert into auth.users (id, email) values ($1, 'private.person@example.test')`, [id]);
    const { rows } = await db.query<{ display_name: string }>("select display_name from public.profiles where id = $1", [id]);
    expect(rows[0].display_name).toBe("Wakati user");
  });
});

describe("Data API privileges", () => {
  it("lets anon read the public listing view without any default grants", async () => {
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select count(*) from public.public_listing_cards")),
    ).resolves.toBeDefined();
  });

  it("denies anon any write privilege on listings", async () => {
    await expect(
      as(db, { role: "anon" }, (tx) =>
        tx.query("insert into public.listings (seller_id, category_id, city_id, slug, title, description) values ($1, $2, $3, 'x', 'Anon listing', 'Twenty characters at least here.')", [ALICE, cars, douala]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("does not let anon call internal helper functions", async () => {
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select public.is_restricted($1, array['suspended']::public.restriction_kind[])", [ALICE])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("reference data", () => {
  it("is publicly readable", async () => {
    const counts = await as(db, { role: "anon" }, async (tx) => ({
      categories: (await tx.query<{ n: number }>("select count(*)::int as n from public.categories")).rows[0].n,
      regions: (await tx.query<{ n: number }>("select count(*)::int as n from public.regions")).rows[0].n,
      cities: (await tx.query<{ n: number }>("select count(*)::int as n from public.cities")).rows[0].n,
    }));
    expect(counts).toEqual({ categories: 35, regions: 10, cities: 12 });
  });

  it("cannot be modified by regular users", async () => {
    const updated = await as(db, { role: "authenticated", userId: ALICE }, async (tx) =>
      (await tx.query("update public.categories set name_en = 'Hacked' where slug = 'cars'")).affectedRows,
    );
    expect(updated).toBe(0);
  });

  it("is idempotent when the seed is applied twice", async () => {
    const { readFileSync } = await import("node:fs");
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from public.categories");
    expect(rows[0].n).toBe(35);
  });
});

describe("listings", () => {
  it("lets a seller publish in a standard category", async () => {
    const row = await insertListing(ALICE, listing());
    expect(row.status).toBe("published");
    expect(row.published_at).not.toBeNull();
  });

  it("turns publication in a review-required category into a review request", async () => {
    const row = await insertListing(ALICE, listing({ category_id: jobs, title: "Driver wanted in Douala" }));
    expect(row.status).toBe("pending_review");
  });

  it("rejects creating a listing for another user", async () => {
    await expect(insertListing(BOB, listing({ seller_id: ALICE }))).rejects.toThrow(/row-level security/);
  });

  it("prevents users from featuring their own listing", async () => {
    await expect(insertListing(ALICE, listing({ is_featured: true }))).rejects.toThrow(/only staff/);
  });

  it("prevents users from modifying someone else's listing", async () => {
    const id = await seedListing(listing({ title: "Alice's original title" }));
    const affected = await as(db, { role: "authenticated", userId: BOB }, async (tx) =>
      (await tx.query("update public.listings set title = 'Bob was here' where id = $1", [id])).affectedRows,
    );
    expect(affected).toBe(0);
    const { rows } = await db.query<{ title: string }>("select title from public.listings where id = $1", [id]);
    expect(rows[0].title).toBe("Alice's original title");
  });

  it("hides drafts from the public but shows them to the owner", async () => {
    const id = await seedListing(listing({ status: "draft", title: "Private draft listing" }));
    const anon = await as(db, { role: "anon" }, async (tx) =>
      (await tx.query("select id from public.listings where id = $1", [id])).rows.length,
    );
    const owner = await as(db, { role: "authenticated", userId: ALICE }, async (tx) =>
      (await tx.query("select id from public.listings where id = $1", [id])).rows.length,
    );
    expect(anon).toBe(0);
    expect(owner).toBe(1);
  });

  it("blocks duplicate active submissions by the same seller", async () => {
    await seedListing(listing({ title: "Unique duplicate check" }));
    await expect(seedListing(listing({ title: "Unique  DUPLICATE check" }))).rejects.toThrow(/duplicate key/);
  });

  it("does not let an owner reverse a moderation removal", async () => {
    const id = await seedListing(listing({ title: "Removed by staff listing", status: "removed" }));
    await expect(
      as(db, { role: "authenticated", userId: ALICE }, (tx) =>
        tx.query("update public.listings set status = 'published' where id = $1", [id]),
      ),
    ).rejects.toThrow(/locked by moderation/);
  });

  describe("moderation and ranking integrity (review findings)", () => {
    const skilled = () => idOf(db, "categories", "skilled-services");
    const update = (userId: string, id: string, set: string, params: unknown[] = []) =>
      as(db, { role: "authenticated", userId }, async (tx) => {
        await tx.query(`update public.listings set ${set} where id = $1`, [id, ...params]);
        return (await tx.query<{ status: string; published_at: Date | null; expires_at: Date | null }>(
          "select status, published_at, expires_at from public.listings where id = $1", [id],
        )).rows[0];
      });

    it("A: moving a live listing into a review-required category sends it to review", async () => {
      const id = await seedListing(listing({ category_id: await skilled(), title: "Cleaning services offered" }));
      const after = await update(ALICE, id, "category_id = $2", [jobs]);
      expect(after.status).toBe("pending_review");
    });

    it("B: sellers cannot choose their own publication date", async () => {
      const id = await seedListing(listing({ title: "Ranking test listing", published_at: new Date("2026-01-01") }));
      const after = await update(ALICE, id, "published_at = '2030-01-01'");
      expect(after.published_at?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
      const row = await insertListing(ALICE, listing({ status: "draft", title: "Draft with a date", published_at: "2030-01-01" }));
      expect(row.published_at).toBeNull();
    });

    it("C: sellers cannot change their listing's expiry", async () => {
      const id = await seedListing(listing({ title: "Expiry test listing", expires_at: new Date("2027-01-01") }));
      const after = await update(ALICE, id, "expires_at = null");
      expect(after.expires_at?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });

    it("D: editing an approved listing in a review-required category sends it back to review", async () => {
      const id = await seedListing(listing({ category_id: jobs, title: "Approved job advert", status: "published" }));
      const after = await update(ALICE, id, "description = 'Send 50 000 FCFA registration fee by Mobile Money first.'");
      expect(after.status).toBe("pending_review");
    });

    it("D: small edits to listings in standard categories stay published", async () => {
      const id = await seedListing(listing({ title: "Standard edit listing" }));
      const after = await update(ALICE, id, "price_xaf = 1400000");
      expect(after.status).toBe("published");
    });

    it("E: listing images must live in the seller's own storage folder", async () => {
      const id = await seedListing(listing({ title: "Image path listing" }));
      await expect(
        as(db, { role: "authenticated", userId: ALICE }, (tx) =>
          tx.query("insert into public.listing_images (listing_id, storage_path) values ($1, $2)", [id, `${BOB}/x/photo.webp`]),
        ),
      ).rejects.toThrow(/row-level security/);
      await as(db, { role: "authenticated", userId: ALICE }, (tx) =>
        tx.query("insert into public.listing_images (listing_id, storage_path) values ($1, $2)", [id, `${ALICE}/${id}/photo.webp`]),
      );
    });
  });

  it("lets moderators remove any listing", async () => {
    const id = await seedListing(listing({ title: "Listing to be moderated" }));
    const affected = await as(db, { role: "authenticated", userId: MOD }, async (tx) =>
      (await tx.query("update public.listings set status = 'removed' where id = $1", [id])).affectedRows,
    );
    expect(affected).toBe(1);
  });

  it("stops restricted accounts from posting", async () => {
    await db.query(
      `insert into public.account_restrictions (user_id, kind, reason) values ($1, 'posting_blocked', 'test')`,
      [BOB],
    );
    await expect(insertListing(BOB, listing({ seller_id: BOB }))).rejects.toThrow(/restricted/);
  });

  it("exposes only published listings through the public card view", async () => {
    const rows = await as(db, { role: "anon" }, async (tx) =>
      (await tx.query<{ title: string }>("select title from public.public_listing_cards")).rows,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.title)).not.toContain("Private draft listing");
    expect(rows.map((r) => r.title)).not.toContain("Removed by staff listing");
  });
});

describe("private data", () => {
  beforeAll(async () => {
    await db.query(
      `insert into public.seller_contacts (user_id, phone_e164, whatsapp_e164, share_consent) values ($1, '+237670000000', '+237670000000', true)`,
      [ALICE],
    );
  });

  it("never exposes seller contact rows to other users", async () => {
    // anon has no privilege on the table at all (not even an empty result).
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select * from public.seller_contacts")),
    ).rejects.toThrow(/permission denied/);
    const bob = await as(db, { role: "authenticated", userId: BOB }, async (tx) =>
      (await tx.query("select * from public.seller_contacts")).rows.length,
    );
    expect(bob).toBe(0);
  });

  it("requires sign-in to reveal a contact number", async () => {
    const id = await seedListing(listing({ title: "Contact reveal listing" }));
    await expect(
      as(db, { role: "anon" }, (tx) => tx.query("select * from public.reveal_listing_contact($1)", [id])),
    ).rejects.toThrow();
    const rows = await as(db, { role: "authenticated", userId: MOD }, async (tx) =>
      (await tx.query<{ phone_e164: string }>("select * from public.reveal_listing_contact($1)", [id])).rows,
    );
    expect(rows[0]?.phone_e164).toBe("+237670000000");
  });

  it("lets users save their own contact details through the API", async () => {
    // Regression: the verification guard used to read a profiles-only column on
    // seller_contacts rows, so every user insert failed (caught by the real-Supabase CI job).
    await as(db, { role: "authenticated", userId: BOB }, async (tx) => {
      await tx.query(
        `insert into public.seller_contacts (user_id, phone_e164, share_consent) values ($1, '+237690000002', true)`,
        [BOB],
      );
      await tx.query(`update public.seller_contacts set share_consent = false where user_id = $1`, [BOB]);
    });
  });

  it("does not let users mark their phone as verified", async () => {
    await expect(
      as(db, { role: "authenticated", userId: BOB }, (tx) =>
        tx.query(
          `insert into public.seller_contacts (user_id, phone_e164, phone_verification) values ($1, '+237690000003', 'verified')`,
          [BOB],
        ),
      ),
    ).rejects.toThrow(/verification status/);
  });

  it("does not let users mark themselves as verified", async () => {
    await expect(
      as(db, { role: "authenticated", userId: ALICE }, (tx) =>
        tx.query("update public.profiles set business_verification = 'verified' where id = $1", [ALICE]),
      ),
    ).rejects.toThrow(/verification status/);
  });

  it("does not let users grant themselves roles", async () => {
    await expect(
      as(db, { role: "authenticated", userId: ALICE }, (tx) =>
        tx.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [ALICE]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("keeps the audit log away from regular users", async () => {
    await db.query(`insert into public.audit_log (actor_id, action, target_type) values ($1, 'test', 'listing')`, [MOD]);
    const visible = await as(db, { role: "authenticated", userId: ALICE }, async (tx) =>
      (await tx.query("select * from public.audit_log")).rows.length,
    );
    expect(visible).toBe(0);
  });
});
