-- Parameterized owner audit search.
-- Keeps search terms out of raw PostgREST filter strings and escapes LIKE wildcards.

create or replace function public.search_audit_log(
  p_search text default null,
  p_target_type text default null,
  p_actor_id uuid default null,
  p_system_actor boolean default false,
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  id uuid,
  actor_id uuid,
  action text,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz,
  actor_display_name text,
  actor_email text,
  actor_role text,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_search text := nullif(trim(p_search), '');
  v_like text;
  v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_search is not null then
    v_search := left(regexp_replace(v_search, '\s+', ' ', 'g'), 80);
    v_like := '%' ||
      replace(replace(replace(v_search, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') ||
      '%';
  end if;

  return query
  select
    a.id,
    a.actor_id,
    a.action,
    a.target_type,
    a.target_id,
    a.metadata,
    a.created_at,
    u.display_name as actor_display_name,
    u.email as actor_email,
    u.role::text as actor_role,
    count(*) over() as total_count
  from public.audit_log a
  left join public.users u on u.id = a.actor_id
  where (p_target_type is null or a.target_type = p_target_type)
    and (
      case
        when p_system_actor then a.actor_id is null
        else p_actor_id is null or a.actor_id = p_actor_id
      end
    )
    and (
      v_like is null
      or a.action ilike v_like escape E'\\'
      or a.target_type ilike v_like escape E'\\'
    )
  order by a.created_at desc
  limit v_limit offset v_offset;
end;
$$;

revoke execute on function public.search_audit_log(text, text, uuid, boolean, integer, integer) from public;
grant execute on function public.search_audit_log(text, text, uuid, boolean, integer, integer) to service_role;
