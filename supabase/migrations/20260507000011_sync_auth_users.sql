-- ============================================================
-- Bulletin — Migration 011: Sync Auth Users
-- Repairs existing auth.users rows that do not yet have a
-- matching public.users profile, and hardens the future trigger.
-- ============================================================

create or replace function public.user_role_from_auth_metadata(metadata jsonb)
returns public.user_role
language sql
stable
set search_path = public, pg_catalog
as $$
  select coalesce(
    (
      select e.enumlabel::text::public.user_role
      from pg_catalog.pg_enum e
      join pg_catalog.pg_type t on t.oid = e.enumtypid
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = 'user_role'
        and e.enumlabel::text = metadata->>'role'
      limit 1
    ),
    'publisher'::public.user_role
  );
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
    public.user_role_from_auth_metadata(new.raw_user_meta_data)
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
  public.user_role_from_auth_metadata(auth_user.raw_user_meta_data) as role,
  false as force_password_change
from auth.users auth_user
where not exists (
  select 1
  from public.users profile
  where profile.id = auth_user.id
)
on conflict (id) do nothing;
