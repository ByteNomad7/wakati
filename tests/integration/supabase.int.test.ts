/**
 * Integration tests against a REAL Supabase stack (Auth/GoTrue, PostgREST,
 * Storage, Postgres). They run in CI against `supabase start`, and against the
 * hosted development project when its credentials are provided as secrets.
 *
 * Required env (never commit values):
 *   SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, SUPABASE_TEST_SERVICE_ROLE_KEY
 *
 * Every user and listing created here is deleted in afterAll.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const configured = Boolean(url && anonKey && serviceKey);

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const password = `Wakati-test-${runId}-9`;
const email = (who: string) => `wakati.ci+${who}.${runId}@example.com`;
const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;

const client = () => createClient(url!, anonKey!, options);

describe.skipIf(!configured)("Supabase backend", () => {
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let aliceId = "";
  let bobId = "";
  let signupId = "";
  const ids: Record<string, string> = {};

  async function confirmedUser(who: string, displayName: string) {
    const { data, error } = await admin.auth.admin.createUser({
      email: email(who),
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, preferred_language: "fr" },
    });
    if (error) throw error;
    const session = client();
    const signIn = await session.auth.signInWithPassword({ email: email(who), password });
    if (signIn.error) throw signIn.error;
    return { id: data.user.id, session };
  }

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, options);
    anon = client();
    ({ id: aliceId, session: alice } = await confirmedUser("alice", "Alice CI"));
    ({ id: bobId, session: bob } = await confirmedUser("bob", "Bob CI"));
    for (const [table, slug] of [
      ["categories", "cars"],
      ["categories", "jobs"],
      ["cities", "douala"],
    ] as const) {
      const { data, error } = await anon.from(table).select("id").eq("slug", slug).single();
      if (error) throw error;
      ids[slug] = data.id;
    }
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.storage.from("listing-images").remove([`${aliceId}/ci/${runId}.png`]);
    for (const id of [aliceId, bobId, signupId].filter(Boolean)) {
      await admin.auth.admin.deleteUser(id); // cascades to profiles, listings, contacts
    }
  });

  const listing = (overrides: Record<string, unknown> = {}) => ({
    seller_id: aliceId,
    category_id: ids.cars,
    city_id: ids.douala,
    slug: `ci-${runId}-${Math.random().toString(36).slice(2, 8)}`,
    title: `CI test vehicle ${runId}`,
    description: "Integration test listing. Deleted automatically after the run.",
    price_xaf: 2_500_000,
    status: "published",
    ...overrides,
  });

  describe("email/password authentication", () => {
    it("signs up with email + password and requires email confirmation", async () => {
      const metadata = { display_name: "Signup CI", preferred_language: "fr" };
      const { data, error } = await anon.auth.signUp({ email: email("signup"), password, options: { data: metadata } });
      if (error?.code === "email_address_not_authorized") {
        // Hosted project still on Supabase's built-in email, which only sends to team
        // members. Create the same unconfirmed user via the admin API instead (no email).
        const created = await admin.auth.admin.createUser({ email: email("signup"), password, user_metadata: metadata });
        expect(created.error).toBeNull();
        signupId = created.data.user!.id;
      } else {
        expect(error).toBeNull();
        expect(data.user?.id).toBeTruthy();
        expect(data.session).toBeNull(); // confirmation pending
        signupId = data.user!.id;
      }

      const early = await client().auth.signInWithPassword({ email: email("signup"), password });
      expect(early.error?.code).toBe("email_not_confirmed");
    });

    it("creates the public profile and private settings from sign-up metadata", async () => {
      const profile = await admin.from("profiles").select("display_name, business_verification").eq("id", signupId).single();
      const settings = await admin.from("user_settings").select("preferred_language").eq("user_id", signupId).single();
      expect(profile.data).toEqual({ display_name: "Signup CI", business_verification: "unverified" });
      expect(settings.data).toEqual({ preferred_language: "fr" });
    });

    it("rejects weak passwords", async () => {
      const { error } = await anon.auth.signUp({ email: email("weak"), password: "short" });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("weak_password");
    });

    it("signs in after confirmation and signs out", async () => {
      await admin.auth.admin.updateUserById(signupId, { email_confirm: true });
      const session = client();
      const { data, error } = await session.auth.signInWithPassword({ email: email("signup"), password });
      expect(error).toBeNull();
      expect(data.session?.access_token).toBeTruthy();
      expect((await session.auth.signOut()).error).toBeNull();
    });

    it("does not offer phone sign-in (SMS is disabled)", async () => {
      const { error } = await anon.auth.signInWithOtp({ phone: "+237670000000" });
      expect(error).not.toBeNull();
    });
  });

  describe("public data through the Data API", () => {
    it("serves the seeded categories, regions and cities to anonymous visitors", async () => {
      const [categories, regions, cities] = await Promise.all([
        anon.from("categories").select("slug", { count: "exact", head: true }),
        anon.from("regions").select("slug", { count: "exact", head: true }),
        anon.from("cities").select("slug", { count: "exact", head: true }),
      ]);
      expect([categories.error, regions.error, cities.error]).toEqual([null, null, null]);
      expect([categories.count, regions.count, cities.count]).toEqual([35, 10, 12]);
    });

    it("embeds category attributes the way the app queries them", async () => {
      const { data, error } = await anon
        .from("categories")
        .select("slug, category_attributes (key, data_type, options)")
        .eq("slug", "cars")
        .single();
      expect(error).toBeNull();
      expect(data!.category_attributes.map((a: { key: string }) => a.key).sort()).toEqual(
        ["fuel_type", "make", "mileage_km", "model", "transmission", "year"],
      );
    });
  });

  describe("listings and row-level security", () => {
    let published = "";

    it("lets a signed-in seller publish in a standard category", async () => {
      const { data, error } = await alice.from("listings").insert(listing()).select("id, status").single();
      expect(error).toBeNull();
      expect(data!.status).toBe("published");
      published = data!.id;
    });

    it("shows the published listing to anonymous visitors via the public view", async () => {
      const { data, error } = await anon
        .from("public_listing_cards")
        .select("id, title, city_slug, price_xaf")
        .eq("id", published)
        .single();
      expect(error).toBeNull();
      expect(data!.city_slug).toBe("douala");
    });

    it("full-text search finds the listing the way the app searches", async () => {
      const { data, error } = await anon
        .from("public_listing_cards")
        .select("id")
        .textSearch("search_vector", `${runId}:*`, { config: "simple" });
      expect(error).toBeNull();
      expect(data!.map((r) => r.id)).toContain(published);
    });

    it("sends review-required categories to moderation", async () => {
      const { data, error } = await alice
        .from("listings")
        .insert(listing({ category_id: ids.jobs, title: `CI job advert ${runId}` }))
        .select("status")
        .single();
      expect(error).toBeNull();
      expect(data!.status).toBe("pending_review");
    });

    it("does not let another user edit or delete the listing", async () => {
      const update = await bob.from("listings").update({ title: "Hijacked title" }).eq("id", published).select("id");
      expect(update.error).toBeNull();
      expect(update.data).toEqual([]);
      const del = await bob.from("listings").delete().eq("id", published).select("id");
      expect(del.data ?? []).toEqual([]);
      const check = await anon.from("listings").select("title").eq("id", published).single();
      expect(check.data!.title).toBe(`CI test vehicle ${runId}`);
    });

    it("does not let a user post as someone else", async () => {
      const { error } = await bob.from("listings").insert(listing());
      expect(error?.code).toBe("42501");
    });

    it("does not let sellers feature their own listing", async () => {
      const { error } = await alice.from("listings").insert(listing({ is_featured: true }));
      expect(error?.message).toMatch(/only staff/);
    });

    it("does not allow anonymous writes", async () => {
      const { error } = await anon.from("listings").insert(listing());
      expect(error).not.toBeNull();
    });
  });

  describe("private data", () => {
    it("keeps seller contact numbers private and reveals them only to signed-in users", async () => {
      const own = await alice
        .from("seller_contacts")
        .insert({ user_id: aliceId, phone_e164: "+237670000001", whatsapp_e164: "+237670000001", share_consent: true });
      expect(own.error).toBeNull();

      const asBob = await bob.from("seller_contacts").select("*");
      expect(asBob.data).toEqual([]);
      const asAnon = await anon.from("seller_contacts").select("*");
      expect(asAnon.error).not.toBeNull();

      const mine = await alice.from("listings").select("id").eq("status", "published").limit(1).single();

      const anonReveal = await anon.rpc("reveal_listing_contact", { p_listing_id: mine.data!.id });
      expect(anonReveal.error).not.toBeNull();
      const bobReveal = await bob.rpc("reveal_listing_contact", { p_listing_id: mine.data!.id });
      expect(bobReveal.error).toBeNull();
      expect(bobReveal.data[0].phone_e164).toBe("+237670000001");
    });

    it("does not let users verify themselves or grant themselves roles", async () => {
      const verify = await alice.from("profiles").update({ business_verification: "verified" }).eq("id", aliceId);
      expect(verify.error?.message).toMatch(/verification status/);
      const role = await alice.from("user_roles").insert({ user_id: aliceId, role: "admin" });
      expect(role.error?.code).toBe("42501");
    });
  });

  describe("storage", () => {
    // 1×1 transparent PNG
    const png = Uint8Array.from(
      atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
      (c) => c.charCodeAt(0),
    );

    it("lets users upload images into their own folder only", async () => {
      const ownPath = `${aliceId}/ci/${runId}.png`;
      const own = await alice.storage.from("listing-images").upload(ownPath, png, { contentType: "image/png" });
      expect(own.error).toBeNull();
      const other = await alice.storage.from("listing-images").upload(`${bobId}/ci/${runId}.png`, png, { contentType: "image/png" });
      expect(other.error).not.toBeNull();
      const anonUpload = await anon.storage.from("listing-images").upload(`${aliceId}/ci/anon-${runId}.png`, png, { contentType: "image/png" });
      expect(anonUpload.error).not.toBeNull();
    });

    it("rejects file types that are not images", async () => {
      const { error } = await alice.storage
        .from("listing-images")
        .upload(`${aliceId}/ci/${runId}.txt`, new TextEncoder().encode("not an image"), { contentType: "text/plain" });
      expect(error).not.toBeNull();
    });

    it("serves uploaded listing images publicly", async () => {
      const { data } = anon.storage.from("listing-images").getPublicUrl(`${aliceId}/ci/${runId}.png`);
      const response = await fetch(data.publicUrl);
      expect(response.status).toBe(200);
    });
  });
});
