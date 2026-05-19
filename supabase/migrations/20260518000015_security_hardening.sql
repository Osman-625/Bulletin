-- Security hardening from May 2026 audit.
-- Service-role clients bypass RLS, so browser roles should not be able to forge audit rows.

drop policy if exists "audit_log: service insert" on public.audit_log;

revoke insert, update, delete on public.audit_log from anon, authenticated;

create index if not exists idx_organization_members_user
  on public.organization_members(user_id);

create index if not exists idx_announcements_public_feed
  on public.announcements(status, scheduled_publish_at, expires_at, published_at desc);

create index if not exists idx_announcements_expires_at
  on public.announcements(expires_at);
