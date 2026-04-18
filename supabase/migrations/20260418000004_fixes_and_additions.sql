-- ============================================================
-- Bulletin — Migration 004
-- Fixes: auth trigger, RLS WITH CHECK on users update
-- Fixes: category seed upsert (idempotent)
-- Adds:  org_type enum + column, invitations table, audit_log table
-- ============================================================

-- ─── Fix: Auth trigger ──────────────────────────────────────
-- Auto-insert a public.users row when a new auth.users entry is created.
-- Without this, login succeeds in Supabase Auth but all app queries fail
-- because there is no matching row in public.users.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'publisher'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Fix: RLS — prevent role self-escalation ────────────────
-- Original policy allowed users to update any field on their own row,
-- including the `role` column. Replace with a check that locks role.

drop policy if exists "users: update own" on public.users;
create policy "users: update own" on public.users
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.users where id = auth.uid())
  );

-- ─── Fix: Category seeds (idempotent upsert) ────────────────

insert into public.categories (name, slug, color) values
  ('Academic',       'academic',       '#3B82F6'),
  ('Events',         'events',         '#8B5CF6'),
  ('Sports',         'sports',         '#10B981'),
  ('Student Life',   'student-life',   '#F59E0B'),
  ('Opportunities',  'opportunities',  '#EF4444'),
  ('General',        'general',        '#6B7280')
on conflict (slug) do update
  set name  = excluded.name,
      color = excluded.color;

-- ─── Add: org_type ──────────────────────────────────────────

create type org_type as enum ('club', 'department', 'society', 'faculty', 'other');

alter table public.organizations
  add column if not exists org_type org_type not null default 'other';

-- ─── Add: invitations ───────────────────────────────────────
-- Invite-only publisher onboarding. Admins create invite tokens;
-- recipients redeem them to register with a pre-assigned role.

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  role        user_role not null default 'publisher',
  invited_by  uuid not null references public.users(id) on delete restrict,
  accepted_at timestamptz,
  expires_at  timestamptz not null default now() + interval '7 days',
  created_at  timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "invitations: admin manage" on public.invitations
  for all using (public.current_user_role() in ('admin', 'super_admin'));

create policy "invitations: read own by email" on public.invitations
  for select using (
    email = (select email from public.users where id = auth.uid())
  );

-- ─── Add: audit_log ─────────────────────────────────────────
-- Records admin and publisher actions for accountability.
-- Inserts are done via the service-role client only.

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log: admin read" on public.audit_log
  for select using (public.current_user_role() in ('admin', 'super_admin'));

create policy "audit_log: service insert" on public.audit_log
  for insert with check (true);
