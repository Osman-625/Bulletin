-- ============================================================
-- Bulletin — Migration 007
-- Fix: self-referential RLS recursion on organization_members
--
-- "org_members: read" had an EXISTS subquery that queried
-- organization_members from within its own policy, causing
-- infinite recursion whenever announcements or organizations
-- were queried (both have policies that join organization_members).
-- ============================================================

drop policy if exists "org_members: read" on public.organization_members;
create policy "org_members: read" on public.organization_members
  for select using (
    user_id = auth.uid()
    or public.current_user_role() in ('admin', 'super_admin')
  );
