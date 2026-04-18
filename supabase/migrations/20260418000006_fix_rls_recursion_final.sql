-- ============================================================
-- Bulletin — Migration 006
-- Fix: definitively break infinite RLS recursion (42P17)
--
-- Root cause: "users: admins read all" and "users: super_admin full"
-- call current_user_role() which queries public.users, which evaluates
-- those same policies again — infinite loop.
--
-- Fix: drop both recursive policies. Admin operations on the users
-- table are handled via createServiceClient() (bypassrls) instead.
-- ============================================================

drop policy if exists "users: admins read all" on public.users;
drop policy if exists "users: super_admin full" on public.users;
