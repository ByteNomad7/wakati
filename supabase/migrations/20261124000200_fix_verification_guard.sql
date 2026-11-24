-- =============================================================================
-- Fix: guard_verification_fields() failed on seller_contacts rows.
--
-- The Phase A version checked both tables' verification columns in one boolean
-- expression. PL/pgSQL evaluated `new.business_verification` for seller_contacts
-- rows too, raising "record "new" has no field "business_verification"", so no
-- signed-in user could save contact details. Found by the real-Supabase CI job.
--
-- Each table's column is now read only inside that table's branch. Behaviour is
-- otherwise unchanged: API users still cannot set verification statuses.
-- =============================================================================

create or replace function public.guard_verification_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.is_api_role() then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      if new.business_verification <> 'unverified' then
        raise exception 'verification status cannot be set by users' using errcode = '42501';
      end if;
    elsif new.business_verification is distinct from old.business_verification then
      raise exception 'verification status cannot be set by users' using errcode = '42501';
    end if;
  elsif tg_table_name = 'seller_contacts' then
    if tg_op = 'INSERT' then
      if new.phone_verification <> 'unverified' then
        raise exception 'verification status cannot be set by users' using errcode = '42501';
      end if;
    elsif new.phone_verification is distinct from old.phone_verification then
      raise exception 'verification status cannot be set by users' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
