-- =============================================================================
-- Revoke Supabase's automatic Data API grants; keep only the explicit ones.
--
-- Found by the first integration run against the hosted development project:
-- with "automatically expose new tables" ON (the hosted default), every public
-- table was ALSO granted to anon/authenticated (ALL privileges), on top of the
-- explicit grants in 20261124000100. RLS still returned no private rows, but
-- e.g. anon could query public.seller_contacts and authenticated could TRUNCATE
-- reference tables. Local CI runs with auto-expose OFF, so it did not show.
--
-- This migration makes both settings behave identically and strictly:
--   1. revoke every table/sequence privilege from anon and authenticated;
--   2. re-apply exactly the explicit grants from 20261124000100 (unchanged);
--   3. change default privileges so tables, sequences and functions created by
--      future migrations are NOT exposed until a migration grants them.
-- service_role keeps its access (trusted server code only).
-- Tightening only: nothing gains access it did not already have.
-- =============================================================================

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

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

-- Future objects created by migrations (which run as postgres) start private.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
