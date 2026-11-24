-- =============================================================================
-- Harden listing moderation and ranking rules (PR #2 review findings A–E)
--
-- For API users who are not staff:
--   A. Moving a live listing into a review-required category sends it to review.
--   B. published_at is server-controlled: set once on first publication, never by
--      the seller (prevents pinning a listing to the top of "Latest listings").
--      Re-publishing an archived listing keeps its original date (no free bumps).
--   C. expires_at is server-controlled (set by trusted server code in Phase B).
--   D. Editing the content of a live listing in a review-required category sends
--      it back to review (prevents changing an approved ad into a scam).
--   E. listing_images rows must point into the seller's own storage folder,
--      <user_id>/<listing_id>/<file>, so sellers cannot borrow others' photos.
--
-- Staff (moderators/admins) and trusted server roles behave exactly as before.
-- Forward-only: replaces one function body and one policy; no data is changed.
-- =============================================================================

create or replace function public.guard_listing_write()
returns trigger
language plpgsql set search_path = '' as $$
declare
  needs_review boolean;
  content_changed boolean := false;
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
    -- B, C: server-controlled timestamps are silently kept.
    new.published_at := old.published_at;
    new.expires_at := old.expires_at;
    content_changed :=
         new.category_id is distinct from old.category_id
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.price_xaf is distinct from old.price_xaf
      or new.attributes is distinct from old.attributes
      or new.condition is distinct from old.condition;
  else
    if new.is_featured or new.featured_until is not null or new.rejection_reason is not null then
      raise exception 'only staff can set moderation fields' using errcode = '42501';
    end if;
    new.published_at := null;
    new.expires_at := null;
  end if;

  if new.status in ('removed', 'rejected', 'expired')
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    raise exception 'only staff can set status %', new.status using errcode = '42501';
  end if;

  if new.status = 'published' then
    select c.moderation_level = 'review_required' into needs_review
    from public.categories c where c.id = new.category_id;
    needs_review := coalesce(needs_review, true);

    if tg_op = 'INSERT' or old.status <> 'published' then
      -- Becoming public: review-required categories go to moderation first.
      if needs_review then
        new.status := 'pending_review';
      else
        new.published_at := coalesce(new.published_at, now());
      end if;
    elsif needs_review and content_changed then
      -- A, D: a live listing that now needs review (new category or edited content).
      new.status := 'pending_review';
    end if;
  end if;

  return new;
end;
$$;

-- E: images must be stored under <seller_id>/<listing_id>/ in the seller's own folder.
drop policy "owners manage listing images" on public.listing_images;
create policy "owners manage listing images" on public.listing_images
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
    and split_part(storage_path, '/', 1) = auth.uid()::text
    and split_part(storage_path, '/', 2) = listing_id::text
  );
