-- ============================================================
-- Bulletin — Core Schema Migration
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────

create type user_role as enum ('super_admin', 'admin', 'publisher');

create type org_status as enum ('pending', 'approved', 'rejected', 'suspended');

create type post_status as enum ('draft', 'published', 'expired', 'archived');

-- ─── users ──────────────────────────────────────────────────
-- Extends Supabase auth.users. Stores role + display info.

create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text not null,
  role          user_role not null default 'publisher',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.users is 'Publisher / Admin / Super Admin profiles linked to Supabase Auth.';

-- ─── organizations ──────────────────────────────────────────
-- A club, department, or society that can publish announcements.

create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  slug          text not null unique,             -- URL-safe identifier
  description   text,
  logo_url      text,
  status        org_status not null default 'pending',
  owner_id      uuid not null references public.users(id) on delete restrict,
  approved_by   uuid references public.users(id), -- admin who approved
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.organizations is 'Clubs / departments that publish announcements. Require admin approval.';

-- Junction: which users belong to which organizations
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  primary key (organization_id, user_id)
);

-- ─── categories ─────────────────────────────────────────────

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  color       text,                               -- hex color for badge
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.categories is 'Announcement categories (e.g. Academic, Events, Sports). Managed by Admins.';

-- Seed default categories
insert into public.categories (name, slug, color) values
  ('Academic',       'academic',       '#3B82F6'),
  ('Events',         'events',         '#8B5CF6'),
  ('Sports',         'sports',         '#10B981'),
  ('Student Life',   'student-life',   '#F59E0B'),
  ('Opportunities',  'opportunities',  '#EF4444'),
  ('General',        'general',        '#6B7280');

-- ─── announcements ──────────────────────────────────────────

create table public.announcements (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  body              text not null,               -- rich text / markdown
  banner_url        text,                         -- Supabase Storage URL
  status            post_status not null default 'draft',
  category_id       uuid references public.categories(id) on delete set null,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  author_id         uuid not null references public.users(id) on delete restrict,
  registration_link text,                         -- optional external link
  published_at      timestamptz,
  expires_at        timestamptz,                  -- defaults to published_at + 30 days
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.announcements is 'Core content table. Lifecycle: draft → published → expired → archived.';

create index idx_announcements_status        on public.announcements(status);
create index idx_announcements_organization  on public.announcements(organization_id);
create index idx_announcements_category      on public.announcements(category_id);
create index idx_announcements_published_at  on public.announcements(published_at desc);

-- ─── Auto-update updated_at ─────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger trg_announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ─── Auto-set expires_at ────────────────────────────────────
-- When an announcement is published, default expires_at to 30 days later.

create or replace function public.set_expires_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  if new.status = 'published' and new.expires_at is null then
    new.expires_at = coalesce(new.published_at, now()) + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger trg_announcements_set_expires
  before insert or update on public.announcements
  for each row execute function public.set_expires_at();
