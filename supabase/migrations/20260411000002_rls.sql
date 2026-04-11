-- ============================================================
-- Bulletin — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.users               enable row level security;
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.categories           enable row level security;
alter table public.announcements        enable row level security;

-- ─── Helper: get current user's role ────────────────────────

create or replace function public.current_user_role()
returns user_role language sql security definer stable as $$
  select role from public.users where id = auth.uid()
$$;

-- ─── users ──────────────────────────────────────────────────

-- Anyone can read their own profile
create policy "users: read own" on public.users
  for select using (id = auth.uid());

-- Admins and super_admins can read all profiles
create policy "users: admins read all" on public.users
  for select using (public.current_user_role() in ('admin', 'super_admin'));

-- Users can update their own non-role fields
create policy "users: update own" on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Only super_admin can change roles
create policy "users: super_admin full" on public.users
  for all using (public.current_user_role() = 'super_admin');

-- ─── organizations ──────────────────────────────────────────

-- Public: anyone can view approved organizations
create policy "orgs: public read approved" on public.organizations
  for select using (status = 'approved');

-- Members can view their own org regardless of status
create policy "orgs: members read own" on public.organizations
  for select using (
    exists (
      select 1 from public.organization_members
      where organization_id = id and user_id = auth.uid()
    )
  );

-- Publishers can create an organization (pending approval)
create policy "orgs: publisher create" on public.organizations
  for insert with check (
    public.current_user_role() in ('publisher', 'admin', 'super_admin')
    and owner_id = auth.uid()
  );

-- Owner can update their own org (non-status fields)
create policy "orgs: owner update" on public.organizations
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Admins can update any org (approve/reject/suspend)
create policy "orgs: admin full" on public.organizations
  for all using (public.current_user_role() in ('admin', 'super_admin'));

-- ─── organization_members ───────────────────────────────────

create policy "org_members: read" on public.organization_members
  for select using (
    user_id = auth.uid()
    or public.current_user_role() in ('admin', 'super_admin')
    or exists (
      select 1 from public.organization_members m2
      where m2.organization_id = organization_id and m2.user_id = auth.uid()
    )
  );

create policy "org_members: admin manage" on public.organization_members
  for all using (public.current_user_role() in ('admin', 'super_admin'));

-- ─── categories ─────────────────────────────────────────────

-- Public: anyone can read active categories
create policy "categories: public read active" on public.categories
  for select using (is_active = true);

-- Admins can manage categories
create policy "categories: admin full" on public.categories
  for all using (public.current_user_role() in ('admin', 'super_admin'));

-- ─── announcements ──────────────────────────────────────────

-- Public: anyone can read published, non-expired announcements
create policy "announcements: public read published" on public.announcements
  for select using (
    status = 'published'
    and (expires_at is null or expires_at > now())
  );

-- Publishers: read their own org's announcements (all statuses)
create policy "announcements: publisher read own org" on public.announcements
  for select using (
    exists (
      select 1 from public.organization_members
      where organization_id = announcements.organization_id
        and user_id = auth.uid()
    )
  );

-- Publishers: create announcements for their org (draft only)
create policy "announcements: publisher create draft" on public.announcements
  for insert with check (
    public.current_user_role() in ('publisher', 'admin', 'super_admin')
    and author_id = auth.uid()
    and exists (
      select 1 from public.organization_members
      where organization_id = announcements.organization_id
        and user_id = auth.uid()
    )
    and status = 'draft'
  );

-- Publishers: update/delete their own draft announcements
create policy "announcements: publisher manage own drafts" on public.announcements
  for update using (
    author_id = auth.uid()
    and status in ('draft', 'published', 'archived')
  );

create policy "announcements: publisher delete own drafts" on public.announcements
  for delete using (
    author_id = auth.uid()
    and status = 'draft'
  );

-- Admins: full access to all announcements
create policy "announcements: admin full" on public.announcements
  for all using (public.current_user_role() in ('admin', 'super_admin'));
