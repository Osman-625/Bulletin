-- Only the server may change users.force_password_change.
--
-- The "users: update own" policy pins `role` but not this flag, so a signed-in user could clear
-- their own flag with one API call and skip the password change an admin forced on them.
-- The app clears the flag with the service role (changePassword), so deploy that code first.
--
-- Roll back:
--   drop trigger if exists guard_force_password_change on public.users;
--   drop function if exists public.guard_force_password_change();

create or replace function public.guard_force_password_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if current_user = 'authenticated'
     and new.force_password_change is distinct from old.force_password_change then
    raise exception 'force_password_change can only be changed by the server'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_force_password_change()
  from public, anon, authenticated;

drop trigger if exists guard_force_password_change on public.users;
create trigger guard_force_password_change
  before update of force_password_change on public.users
  for each row execute function public.guard_force_password_change();
