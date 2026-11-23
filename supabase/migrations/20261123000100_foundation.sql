-- =============================================================================
-- Wakati – foundation schema (Phase A)
--
-- Creates reference data (categories, locations), the listing model used by
-- Phase B, and trust & safety tables used by Phase C, with row-level security
-- on every table. Nothing here enables payments, escrow or paid features.
--
-- Target: Supabase PostgreSQL 15+ (uses auth.uid(), auth.users and the
-- anon / authenticated roles provided by Supabase).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type public.moderation_level as enum ('standard', 'review_required');
create type public.attribute_data_type as enum ('text', 'integer', 'decimal', 'year', 'select', 'boolean');
create type public.listing_status as enum (
  'draft',           -- private, editable by the owner
  'pending_review',  -- submitted, waiting for moderation
  'published',       -- publicly visible
  'rejected',        -- refused by moderation (owner can see it)
  'removed',         -- taken down by staff
  'archived',        -- withdrawn by the owner (sold / no longer available)
  'expired'          -- reached its expiry date
);
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair', 'for_parts');
create type public.seller_type as enum ('private', 'business');
create type public.contact_method as enum ('phone', 'whatsapp', 'phone_and_whatsapp');
create type public.app_role as enum ('moderator', 'admin');
create type public.restriction_kind as enum ('posting_blocked', 'suspended');
create type public.report_reason as enum (
  'scam_or_fraud', 'prohibited_item', 'wrong_category', 'duplicate',
  'offensive', 'misleading', 'already_sold', 'other'
);
create type public.report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles (staff permissions are server-validated through these helpers)
-- ---------------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(required public.app_role)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid()
      and (r.role = required or r.role = 'admin')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Locations: regions → cities → neighbourhoods (regions are never cities)
-- ---------------------------------------------------------------------------
create table public.regions (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en    text not null,
  name_fr    text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true
);

create table public.cities (
  id          uuid primary key default gen_random_uuid(),
  region_id   uuid not null references public.regions (id) on delete restrict,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en     text not null,
  name_fr     text not null,
  latitude    numeric(9, 6),
  longitude   numeric(9, 6),
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0
);
create index cities_region_idx on public.cities (region_id);

create table public.neighbourhoods (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid not null references public.cities (id) on delete cascade,
  slug       text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null,
  is_active  boolean not null default true,
  sort_order integer not null default 0,
  unique (city_id, slug)
);

-- ---------------------------------------------------------------------------
-- Categories (database-driven tree) and category-specific fields
-- ---------------------------------------------------------------------------
create table public.categories (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid references public.categories (id) on delete restrict,
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en          text not null,
  name_fr          text not null,
  icon             text,
  sort_order       integer not null default 0,
  has_condition    boolean not null default false,
  moderation_level public.moderation_level not null default 'standard',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on public.categories (parent_id);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- Field definitions are inherited by descendant categories (see effectiveAttributes()).
create table public.category_attributes (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  key         text not null check (key ~ '^[a-z][a-z0-9_]*$'),
  data_type   public.attribute_data_type not null,
  label_en    text not null,
  label_fr    text not null,
  options     jsonb,  -- [{ "value": "...", "label_en": "...", "label_fr": "..." }] for select fields
  is_required boolean not null default false,
  is_filterable boolean not null default false,
  min_value   numeric,
  max_value   numeric,
  unit        text,
  sort_order  integer not null default 0,
  unique (category_id, key),
  check (data_type <> 'select' or jsonb_typeof(options) = 'array')
);

-- ---------------------------------------------------------------------------
-- Profiles: public profile, private settings and restrictions are separate
-- tables so that RLS can expose only what is safe.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 60),
  avatar_path   text,
  seller_type   public.seller_type not null default 'private',
  business_name text check (business_name is null or char_length(business_name) between 2 and 100),
  -- Verification is a future capability: nothing in the app sets 'verified' yet.
  business_verification public.verification_status not null default 'unverified',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_settings (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'fr')),
  updated_at         timestamptz not null default now()
);
create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

-- Private contact details. Never readable by other users directly.
create table public.seller_contacts (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  phone_e164          text check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  whatsapp_e164       text check (whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  -- Explicit consent to reveal the number to signed-in buyers on published listings.
  share_consent       boolean not null default false,
  share_consent_at    timestamptz,
  phone_verification  public.verification_status not null default 'unverified',
  updated_at          timestamptz not null default now()
);
create trigger seller_contacts_updated_at before update on public.seller_contacts
  for each row execute function public.set_updated_at();

create table public.account_restrictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       public.restriction_kind not null,
  reason     text not null,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  lifted_at  timestamptz,
  lifted_by  uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index account_restrictions_user_idx on public.account_restrictions (user_id);

create or replace function public.is_restricted(target uuid, kinds public.restriction_kind[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.account_restrictions ar
    where ar.user_id = target
      and ar.kind = any (kinds)
      and ar.lifted_at is null
      and ar.starts_at <= now()
      and (ar.ends_at is null or ar.ends_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- Listings (Phase B uses these; Phase A only reads published rows)
-- ---------------------------------------------------------------------------
create table public.listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references auth.users (id) on delete cascade,
  category_id      uuid not null references public.categories (id) on delete restrict,
  city_id          uuid not null references public.cities (id) on delete restrict,
  neighbourhood_id uuid references public.neighbourhoods (id) on delete set null,
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null check (char_length(title) between 5 and 120),
  description      text not null check (char_length(description) between 20 and 5000),
  -- Language the seller wrote in; content is stored as written, never auto-translated.
  content_language text not null default 'en' check (content_language in ('en', 'fr')),
  price_xaf        bigint check (price_xaf is null or price_xaf between 0 and 100000000000),
  is_negotiable    boolean not null default false,
  condition        public.listing_condition,
  attributes       jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  contact_method   public.contact_method not null default 'phone_and_whatsapp',
  status           public.listing_status not null default 'draft',
  rejection_reason text,
  -- Featured placement is staff-controlled only (no paid promotion exists).
  is_featured      boolean not null default false,
  featured_until   timestamptz,
  published_at     timestamptz,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search_vector    tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(description, '')), 'B')
  ) stored,
  -- Used to block the same seller submitting the same ad twice.
  content_fingerprint text generated always as (
    md5(lower(regexp_replace(title, '\s+', ' ', 'g')) || '|' || category_id::text || '|' || coalesce(price_xaf::text, ''))
  ) stored
);
create index listings_public_idx on public.listings (status, published_at desc);
create index listings_category_idx on public.listings (category_id, status, published_at desc);
create index listings_city_idx on public.listings (city_id, status, published_at desc);
create index listings_price_idx on public.listings (status, price_xaf);
create index listings_seller_idx on public.listings (seller_id, created_at desc);
create index listings_search_idx on public.listings using gin (search_vector);
create unique index listings_no_duplicates_idx on public.listings (seller_id, content_fingerprint)
  where status in ('pending_review', 'published');
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create table public.listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  storage_path text not null unique,
  position     smallint not null default 0 check (position between 0 and 19),
  width        integer check (width > 0),
  height       integer check (height > 0),
  created_at   timestamptz not null default now(),
  unique (listing_id, position)
);

create table public.saved_listings (
  user_id    uuid not null references auth.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- Trust & safety (Phase C builds the UI on these)
-- ---------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason      public.report_reason not null,
  details     text check (details is null or char_length(details) <= 1000),
  status      public.report_status not null default 'open',
  handled_by  uuid references auth.users (id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (listing_id, reporter_id)
);
create index reports_status_idx on public.reports (status, created_at);

-- Append-only record of staff and security-relevant actions.
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

-- Records each phone-number reveal; used to rate-limit harvesting.
create table public.contact_reveals (
  id           bigint generated always as identity primary key,
  listing_id   uuid not null references public.listings (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index contact_reveals_requester_idx on public.contact_reveals (requester_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Listing guard: enforces moderation rules server-side for non-staff users.
-- ---------------------------------------------------------------------------
-- Runs as the caller (security invoker): requests from the API roles are
-- checked; trusted server roles (service_role, migrations) are not.
create or replace function public.is_api_role()
returns boolean language sql stable as $$
  select current_user in ('anon', 'authenticated');
$$;

create or replace function public.guard_listing_write()
returns trigger
language plpgsql set search_path = '' as $$
declare
  needs_review boolean;
begin
  if not public.is_api_role() or public.is_staff() then
    if new.status = 'published' and new.published_at is null then
      new.published_at := now();
    end if;
    return new;
  end if;

  if public.is_restricted(new.seller_id, array['posting_blocked', 'suspended']::public.restriction_kind[]) then
    raise exception 'account is restricted from posting' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    if new.seller_id <> old.seller_id then
      raise exception 'seller cannot be changed' using errcode = '42501';
    end if;
    -- Staff decisions cannot be undone by the owner.
    if old.status in ('removed', 'rejected') and new.status <> old.status then
      raise exception 'listing status is locked by moderation' using errcode = '42501';
    end if;
    if new.is_featured is distinct from old.is_featured
       or new.featured_until is distinct from old.featured_until
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'only staff can change moderation fields' using errcode = '42501';
    end if;
  else
    if new.is_featured or new.featured_until is not null or new.rejection_reason is not null then
      raise exception 'only staff can set moderation fields' using errcode = '42501';
    end if;
  end if;

  if new.status in ('removed', 'rejected', 'expired')
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    raise exception 'only staff can set status %', new.status using errcode = '42501';
  end if;

  -- Publishing in a review-required category becomes a review request instead.
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    select c.moderation_level = 'review_required' into needs_review
    from public.categories c where c.id = new.category_id;
    if coalesce(needs_review, true) then
      new.status := 'pending_review';
    else
      new.published_at := now();
    end if;
  end if;

  return new;
end;
$$;

create trigger listings_guard before insert or update on public.listings
  for each row execute function public.guard_listing_write();

-- ---------------------------------------------------------------------------
-- Contact reveal: the only way to read a seller's number. Signed-in users only,
-- consent required, rate-limited, and logged.
-- ---------------------------------------------------------------------------
create or replace function public.reveal_listing_contact(p_listing_id uuid)
returns table (phone_e164 text, whatsapp_e164 text, contact_method public.contact_method)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  requester uuid := auth.uid();
  recent integer;
begin
  if requester is null then
    raise exception 'sign in to view contact details' using errcode = '42501';
  end if;
  if public.is_restricted(requester, array['suspended']::public.restriction_kind[]) then
    raise exception 'account is suspended' using errcode = '42501';
  end if;

  select count(*) into recent from public.contact_reveals cr
  where cr.requester_id = requester and cr.created_at > now() - interval '1 hour';
  if recent >= 30 then
    raise exception 'too many contact requests, try again later' using errcode = '54000';
  end if;

  insert into public.contact_reveals (listing_id, requester_id)
  select l.id, requester from public.listings l
  where l.id = p_listing_id and l.status = 'published';

  return query
    select
      case when l.contact_method in ('phone', 'phone_and_whatsapp') then sc.phone_e164 end,
      case when l.contact_method in ('whatsapp', 'phone_and_whatsapp') then sc.whatsapp_e164 end,
      l.contact_method
    from public.listings l
    join public.seller_contacts sc on sc.user_id = l.seller_id
    where l.id = p_listing_id
      and l.status = 'published'
      and sc.share_consent
      and not public.is_restricted(l.seller_id, array['suspended']::public.restriction_kind[]);
end;
$$;

-- ---------------------------------------------------------------------------
-- Public read model: published listings only, no private columns.
-- security_invoker = true means the caller's RLS applies.
-- ---------------------------------------------------------------------------
create view public.public_listing_cards
with (security_invoker = true) as
select
  l.id,
  l.slug,
  l.title,
  l.price_xaf,
  l.is_negotiable,
  l.condition,
  l.category_id,
  l.city_id,
  c.slug     as city_slug,
  c.name_en  as city_name_en,
  c.name_fr  as city_name_fr,
  n.name     as neighbourhood_name,
  (select li.storage_path from public.listing_images li
     where li.listing_id = l.id order by li.position limit 1) as cover_image_path,
  l.published_at,
  p.seller_type,
  l.is_featured and coalesce(l.featured_until > now(), false) as is_featured_now,
  l.search_vector
from public.listings l
join public.cities c on c.id = l.city_id
left join public.neighbourhoods n on n.id = l.neighbourhood_id
join public.profiles p on p.id = l.seller_id
where l.status = 'published'
  and (l.expires_at is null or l.expires_at > now());

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.user_roles           enable row level security;
alter table public.regions              enable row level security;
alter table public.cities               enable row level security;
alter table public.neighbourhoods       enable row level security;
alter table public.categories           enable row level security;
alter table public.category_attributes  enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_settings        enable row level security;
alter table public.seller_contacts      enable row level security;
alter table public.account_restrictions enable row level security;
alter table public.listings             enable row level security;
alter table public.listing_images       enable row level security;
alter table public.saved_listings       enable row level security;
alter table public.reports              enable row level security;
alter table public.audit_log            enable row level security;
alter table public.contact_reveals      enable row level security;

-- Roles: users may see their own roles; only admins manage roles.
create policy "own roles readable" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role('admin'));
create policy "admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Reference data: public read of active rows; staff manage.
create policy "active regions are public" on public.regions
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "admins manage regions" on public.regions
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "active cities are public" on public.cities
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "admins manage cities" on public.cities
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "active neighbourhoods are public" on public.neighbourhoods
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "admins manage neighbourhoods" on public.neighbourhoods
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "active categories are public" on public.categories
  for select to anon, authenticated using (is_active or public.is_staff());
create policy "admins manage categories" on public.categories
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "category attributes are public" on public.category_attributes
  for select to anon, authenticated using (true);
create policy "admins manage category attributes" on public.category_attributes
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Profiles: public display fields; owners edit their own (verification is staff-only, see grants).
create policy "profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "owners create their profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "owners update their profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff manage profiles" on public.profiles
  for update to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- Private settings and contacts: owner only.
create policy "owners manage settings" on public.user_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owners manage contacts" on public.seller_contacts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Restrictions: users can see their own; moderators manage.
create policy "own restrictions readable" on public.account_restrictions
  for select to authenticated using (user_id = auth.uid() or public.has_role('moderator'));
create policy "moderators manage restrictions" on public.account_restrictions
  for all to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- Listings: published rows are public; owners see and edit their own; staff see all.
create policy "published listings are public" on public.listings
  for select to anon, authenticated
  using (status = 'published' and (expires_at is null or expires_at > now()));
create policy "owners read own listings" on public.listings
  for select to authenticated using (seller_id = auth.uid());
create policy "staff read all listings" on public.listings
  for select to authenticated using (public.has_role('moderator'));
create policy "owners create listings" on public.listings
  for insert to authenticated
  with check (seller_id = auth.uid() and status in ('draft', 'pending_review', 'published'));
create policy "owners update own listings" on public.listings
  for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "owners delete own drafts" on public.listings
  for delete to authenticated using (seller_id = auth.uid() and status = 'draft');
create policy "staff moderate listings" on public.listings
  for update to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- Listing images follow the visibility of their listing.
create policy "images visible with listing" on public.listing_images
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "owners manage listing images" on public.listing_images
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- Saved listings: owner only.
create policy "owners manage saved listings" on public.saved_listings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reports: signed-in users file reports; reporters see their own; moderators handle them.
create policy "users file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy "reporters and staff read reports" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.has_role('moderator'));
create policy "moderators handle reports" on public.reports
  for update to authenticated using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- Audit log: staff read; staff append; never updated or deleted.
create policy "staff read audit log" on public.audit_log
  for select to authenticated using (public.has_role('moderator'));
create policy "staff append audit log" on public.audit_log
  for insert to authenticated with check (public.is_staff() and actor_id = auth.uid());

-- Contact reveals: written only by reveal_listing_contact(); admins may read.
create policy "admins read contact reveals" on public.contact_reveals
  for select to authenticated using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Column-level protections and grants
-- ---------------------------------------------------------------------------
-- Verification flags can only be changed by trusted server code (service role),
-- never through the public API. (A column REVOKE would not override Supabase's
-- default table grants, so this is enforced with triggers.)
create or replace function public.guard_verification_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_api_role() then
    if tg_table_name = 'profiles' and (
         (tg_op = 'INSERT' and new.business_verification <> 'unverified') or
         (tg_op = 'UPDATE' and new.business_verification is distinct from old.business_verification)) then
      raise exception 'verification status cannot be set by users' using errcode = '42501';
    end if;
    if tg_table_name = 'seller_contacts' and (
         (tg_op = 'INSERT' and new.phone_verification <> 'unverified') or
         (tg_op = 'UPDATE' and new.phone_verification is distinct from old.phone_verification)) then
      raise exception 'verification status cannot be set by users' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_verification_guard before insert or update on public.profiles
  for each row execute function public.guard_verification_fields();
create trigger seller_contacts_verification_guard before insert or update on public.seller_contacts
  for each row execute function public.guard_verification_fields();

-- Reference tables and logs are not writable through the API except via policies above.
revoke insert, update, delete on public.contact_reveals from anon, authenticated;

revoke all on function public.reveal_listing_contact(uuid) from public, anon;
grant execute on function public.reveal_listing_contact(uuid) to authenticated;

grant select on public.public_listing_cards to anon, authenticated;
