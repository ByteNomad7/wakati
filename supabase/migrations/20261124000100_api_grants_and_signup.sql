-- =============================================================================
-- Wakati – explicit Data API privileges and sign-up profile creation (Phase B prep)
--
-- 1. Explicit grants. Phase A relied on Supabase's default privileges, which
--    grant every new table in `public` to anon/authenticated. Projects can turn
--    that off ("auto-expose new tables"), in which case the app would get
--    "permission denied" before RLS is even evaluated. These grants make the
--    schema work identically either way. RLS still decides which rows each
--    role can see or change; grants only open the door.
-- 2. A trigger that creates the public profile and private settings rows when
--    a user signs up through Supabase Auth.
--
-- Additive only: no existing table, column or policy is changed.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Trusted server role: full access (it bypasses RLS by design; server code only).
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Reference data: readable by everyone; writes are limited to admins by RLS.
grant select on public.regions, public.cities, public.neighbourhoods,
                public.categories, public.category_attributes
  to anon, authenticated;
grant insert, update, delete on public.regions, public.cities, public.neighbourhoods,
                                public.categories, public.category_attributes
  to authenticated;

-- Profiles and private user data.
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_settings to authenticated;
grant select, insert, update, delete on public.seller_contacts to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.account_restrictions to authenticated;

-- Listings.
grant select on public.listings, public.listing_images to anon, authenticated;
grant insert, update, delete on public.listings, public.listing_images to authenticated;
grant select on public.public_listing_cards to anon, authenticated;
grant select, insert, delete on public.saved_listings to authenticated;

-- Trust & safety.
grant select, insert, update on public.reports to authenticated;
grant select, insert on public.audit_log to authenticated;
grant usage on sequence public.audit_log_id_seq to authenticated;
grant select on public.contact_reveals to authenticated;

-- Functions. Postgres grants EXECUTE to PUBLIC by default; be explicit instead.
revoke execute on all functions in schema public from public, anon, authenticated;
-- Used inside RLS policies, so every API role must be able to call them.
grant execute on function public.has_role(public.app_role) to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_api_role() to anon, authenticated;
-- Used by the listing guard (runs as the signed-in user). Not exposed to anon.
grant execute on function public.is_restricted(uuid, public.restriction_kind[]) to authenticated;
-- Contact reveal: signed-in users only (the function also checks this itself).
grant execute on function public.reveal_listing_contact(uuid) to authenticated;
-- Trigger functions run with the privileges of the statement's role.
grant execute on function public.set_updated_at() to authenticated;
grant execute on function public.guard_listing_write() to authenticated;
grant execute on function public.guard_verification_fields() to authenticated;

-- -----------------------------------------------------------------------------
-- Sign-up: create the profile and settings rows for every new auth user.
-- display_name and preferred_language come from the sign-up form's metadata.
-- The email address is never used as a public display name.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested_name text := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60);
  requested_language text := new.raw_user_meta_data ->> 'preferred_language';
begin
  if char_length(requested_name) < 2 then
    requested_name := 'Wakati user';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, requested_name)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, preferred_language)
  values (new.id, case when requested_language in ('en', 'fr') then requested_language else 'en' end)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
