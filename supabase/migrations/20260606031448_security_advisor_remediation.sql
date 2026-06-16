-- ============================================================
-- Bulletin - Migration 022: Security advisor remediation
-- Fixes:
--   - server-only rate-limit RPC was executable by client roles
--   - internal trigger helpers were exposed through the Data API
--   - trigger functions inherited a mutable search_path
--   - future public functions and tables inherited client grants
--
-- Intentionally unchanged:
--   - rate_limit_buckets keeps RLS enabled with no policies
--   - current_user_role remains callable because RLS policies use it
--   - increment_announcement_view remains the public view-counter RPC
--
-- Hosted Auth leaked-password protection is not a database setting.
-- Enable it separately in Dashboard > Authentication > Providers > Email.
-- ============================================================

begin;

-- Existing projects can have explicit anon/authenticated grants in addition
-- to PostgreSQL's PUBLIC function grant. Revoke all three client paths.
revoke execute on function public.hit_rate_limit(text, integer, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer, timestamptz)
  to service_role;

-- Trigger functions are invoked by their triggers, not through PostgREST RPC.
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;
revoke execute on function public.set_updated_at()
  from public, anon, authenticated;
revoke execute on function public.set_expires_at()
  from public, anon, authenticated;
revoke execute on function public.prevent_publisher_org_approval_field_updates()
  from public, anon, authenticated;

-- This event-trigger helper exists on the hosted database but is not part of
-- the repository migration chain. Keep this migration valid for fresh builds.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute
      'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
    execute
      'alter function public.rls_auto_enable() set search_path = pg_catalog';
  end if;
end;
$$;

-- Every referenced application object is schema-qualified, so privileged
-- functions only need trusted pg_catalog name resolution.
alter function public.hit_rate_limit(text, integer, integer, timestamptz)
  set search_path = pg_catalog;
alter function public.handle_new_user()
  set search_path = pg_catalog;
alter function public.current_user_role()
  set search_path = pg_catalog;
alter function public.increment_announcement_view(uuid)
  set search_path = pg_catalog;
alter function public.set_updated_at()
  set search_path = pg_catalog;
alter function public.set_expires_at()
  set search_path = pg_catalog;
alter function public.prevent_publisher_org_approval_field_updates()
  set search_path = pg_catalog;

-- Make future Data API exposure opt-in for objects created by application
-- migrations. Keep service_role defaults unchanged for server-side operations.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

-- Fail atomically if the critical access model was not established.
do $$
begin
  if has_function_privilege(
    'anon',
    'public.hit_rate_limit(text,integer,integer,timestamp with time zone)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.hit_rate_limit(text,integer,integer,timestamp with time zone)',
    'execute'
  ) then
    raise exception 'hit_rate_limit remains executable by a client role';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.hit_rate_limit(text,integer,integer,timestamp with time zone)',
    'execute'
  ) then
    raise exception 'service_role cannot execute hit_rate_limit';
  end if;

  if has_function_privilege('anon', 'public.handle_new_user()', 'execute')
    or has_function_privilege('authenticated', 'public.handle_new_user()', 'execute')
    or has_function_privilege('anon', 'public.set_updated_at()', 'execute')
    or has_function_privilege('authenticated', 'public.set_updated_at()', 'execute')
    or has_function_privilege('anon', 'public.set_expires_at()', 'execute')
    or has_function_privilege('authenticated', 'public.set_expires_at()', 'execute')
    or has_function_privilege(
      'anon',
      'public.prevent_publisher_org_approval_field_updates()',
      'execute'
    )
    or has_function_privilege(
      'authenticated',
      'public.prevent_publisher_org_approval_field_updates()',
      'execute'
    )
  then
    raise exception 'an internal trigger function remains executable by a client role';
  end if;

  if to_regprocedure('public.rls_auto_enable()') is not null then
    if
      has_function_privilege('anon', 'public.rls_auto_enable()', 'execute')
      or has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute')
    then
      raise exception 'rls_auto_enable remains executable by a client role';
    end if;
  end if;

  if not exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'rate_limit_buckets'
      and relation.relrowsecurity
  ) then
    raise exception 'rate_limit_buckets must keep RLS enabled';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rate_limit_buckets'
  ) then
    raise exception 'rate_limit_buckets must remain deny-all without client policies';
  end if;

  if has_table_privilege('anon', 'public.rate_limit_buckets', 'select')
    or has_table_privilege('anon', 'public.rate_limit_buckets', 'insert')
    or has_table_privilege('anon', 'public.rate_limit_buckets', 'update')
    or has_table_privilege('anon', 'public.rate_limit_buckets', 'delete')
    or has_table_privilege('authenticated', 'public.rate_limit_buckets', 'select')
    or has_table_privilege('authenticated', 'public.rate_limit_buckets', 'insert')
    or has_table_privilege('authenticated', 'public.rate_limit_buckets', 'update')
    or has_table_privilege('authenticated', 'public.rate_limit_buckets', 'delete')
  then
    raise exception 'a client role has direct access to rate_limit_buckets';
  end if;
end;
$$;

commit;

-- SQL Editor verification output. These queries do not modify data.
select
  namespace.nspname as schema_name,
  proc.proname as function_name,
  pg_get_function_identity_arguments(proc.oid) as arguments,
  proc.prosecdef as security_definer,
  proc.proconfig as configuration,
  has_function_privilege('anon', proc.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', proc.oid, 'execute') as authenticated_execute,
  has_function_privilege('service_role', proc.oid, 'execute') as service_role_execute
from pg_proc proc
join pg_namespace namespace on namespace.oid = proc.pronamespace
where namespace.nspname = 'public'
  and proc.proname in (
    'current_user_role',
    'handle_new_user',
    'hit_rate_limit',
    'increment_announcement_view',
    'prevent_publisher_org_approval_field_updates',
    'rls_auto_enable',
    'set_expires_at',
    'set_updated_at'
  )
order by proc.proname, arguments;

select
  relation.relrowsecurity as rls_enabled,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rate_limit_buckets'
  ) as policy_count,
  has_table_privilege('anon', 'public.rate_limit_buckets', 'select') as anon_select,
  has_table_privilege('authenticated', 'public.rate_limit_buckets', 'select')
    as authenticated_select,
  has_table_privilege('service_role', 'public.rate_limit_buckets', 'select')
    as service_role_select
from pg_class relation
join pg_namespace namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = 'rate_limit_buckets';
