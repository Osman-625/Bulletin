-- Distributed rate-limit buckets for server-side auth/setup throttles.

create table if not exists public.rate_limit_buckets (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;

revoke all on public.rate_limit_buckets from anon, authenticated;

create index if not exists idx_rate_limit_buckets_reset_at
  on public.rate_limit_buckets (reset_at);

create or replace function public.hit_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer,
  p_now timestamptz default now()
)
returns table (
  limited boolean,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_reset_at timestamptz;
  v_window interval;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'rate limit key is required';
  end if;

  if p_limit < 1 then
    raise exception 'rate limit must be positive';
  end if;

  if p_window_ms < 1000 then
    raise exception 'rate limit window must be at least 1000ms';
  end if;

  v_window := make_interval(secs => p_window_ms / 1000.0);

  insert into public.rate_limit_buckets as bucket (key, count, reset_at, updated_at)
  values (p_key, 1, p_now + v_window, p_now)
  on conflict (key) do update
    set count = case
          when bucket.reset_at <= p_now then 1
          else bucket.count + 1
        end,
        reset_at = case
          when bucket.reset_at <= p_now then p_now + v_window
          else bucket.reset_at
        end,
        updated_at = p_now
  returning bucket.count, bucket.reset_at
  into v_count, v_reset_at;

  limited := v_count > p_limit;
  remaining := greatest(p_limit - v_count, 0);
  reset_at := v_reset_at;
  retry_after_seconds := case
    when limited then greatest(ceil(extract(epoch from (v_reset_at - p_now)))::integer, 1)
    else 0
  end;

  return next;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer, timestamptz) from public;
grant execute on function public.hit_rate_limit(text, integer, integer, timestamptz) to service_role;
