-- Backend improvement hardening.
--
-- - Keep rejected announcement revisions possible for publishers without
--   loosening organization membership checks.
-- - Force the public view counter through the rate-limited server action by
--   removing direct anon/authenticated RPC execution.

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
    and status in ('draft', 'submitted', 'rejected')
    and exists (
      select 1
      from public.organization_members
      where organization_id = announcements.organization_id
        and user_id = auth.uid()
    )
  );

revoke execute on function public.increment_announcement_view(uuid)
  from public, anon, authenticated;
grant execute on function public.increment_announcement_view(uuid) to service_role;
