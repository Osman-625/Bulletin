-- ============================================================
-- Bulletin — Migration 021: Auth and RLS hardening
-- Fixes:
--   - auth profile sync must not trust client-controlled metadata roles
--   - publisher organization owners cannot change approval/ownership fields
--   - publisher announcement updates remain scoped to current org membership
-- ============================================================

-- Keep the legacy helper name for compatibility, but make it intentionally
-- ignore raw_user_meta_data because that metadata is user-editable.
create or replace function public.user_role_from_auth_metadata(metadata jsonb)
returns public.user_role
language sql
stable
set search_path = public, pg_catalog
as $$
  select 'publisher'::public.user_role;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  profile_email text;
  profile_name text;
begin
  profile_email := coalesce(nullif(new.email, ''), 'user-' || new.id::text || '@auth.local');
  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(profile_email, '@', 1)
  );

  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    profile_email,
    profile_name,
    'publisher'::public.user_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.users (id, email, display_name, role, force_password_change)
select
  auth_user.id,
  coalesce(nullif(auth_user.email, ''), 'user-' || auth_user.id::text || '@auth.local') as email,
  coalesce(
    nullif(auth_user.raw_user_meta_data->>'display_name', ''),
    nullif(auth_user.raw_user_meta_data->>'full_name', ''),
    nullif(auth_user.raw_user_meta_data->>'name', ''),
    nullif(auth_user.raw_user_meta_data->>'username', ''),
    split_part(coalesce(nullif(auth_user.email, ''), 'user-' || auth_user.id::text || '@auth.local'), '@', 1)
  ) as display_name,
  'publisher'::public.user_role as role,
  false as force_password_change
from auth.users auth_user
where not exists (
  select 1
  from public.users profile
  where profile.id = auth_user.id
)
on conflict (id) do nothing;

create or replace function public.prevent_publisher_org_approval_field_updates()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if auth.uid() is not null
    and old.owner_id = auth.uid()
    and public.current_user_role() = 'publisher'
    and (
      new.owner_id is distinct from old.owner_id
      or new.status is distinct from old.status
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at
    )
  then
    raise exception 'Publisher organization owners cannot change organization approval or ownership fields'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_publisher_org_approval_field_updates on public.organizations;
create trigger prevent_publisher_org_approval_field_updates
  before update on public.organizations
  for each row execute function public.prevent_publisher_org_approval_field_updates();

drop policy if exists "orgs: owner update" on public.organizations;
create policy "orgs: owner update" on public.organizations
  for update
  using (
    public.current_user_role() = 'publisher'
    and owner_id = auth.uid()
  )
  with check (
    public.current_user_role() = 'publisher'
    and owner_id = auth.uid()
  );

drop policy if exists "announcements: publisher manage own drafts" on public.announcements;
drop policy if exists "announcements: publisher update own" on public.announcements;
create policy "announcements: publisher update own" on public.announcements
  for update
  using (
    author_id = auth.uid()
    and status in ('draft', 'submitted', 'rejected')
    and exists (
      select 1
      from public.organization_members
      where organization_id = announcements.organization_id
        and user_id = auth.uid()
    )
  )
  with check (
    author_id = auth.uid()
    and status in ('draft', 'submitted')
    and exists (
      select 1
      from public.organization_members
      where organization_id = announcements.organization_id
        and user_id = auth.uid()
    )
  );
