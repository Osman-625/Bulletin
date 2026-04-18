-- ============================================================
-- Bulletin — Migration 005
-- Fix: infinite recursion (42P17) in RLS policies
--
-- Root cause A: current_user_role() queries public.users without
--   bypassing RLS, so policies on users that call current_user_role()
--   create a recursive loop.
-- Root cause B: Migration 004's "users: update own" WITH CHECK used
--   an inline subquery on public.users instead of the SECURITY DEFINER
--   function, triggering the same loop on UPDATE.
-- ============================================================

-- ─── Fix A: current_user_role — explicitly bypass row security ─

create or replace function public.current_user_role()
returns user_role language sql security definer stable
set search_path = public
set row_security = off
as $$
  select role from public.users where id = auth.uid()
$$;

-- ─── Fix B: users: update own — use security definer function ──
-- Replace the inline subquery (which triggers RLS recursion)
-- with the SECURITY DEFINER current_user_role() function.

drop policy if exists "users: update own" on public.users;
create policy "users: update own" on public.users
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.current_user_role()
  );
