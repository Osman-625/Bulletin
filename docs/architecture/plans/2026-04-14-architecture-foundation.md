# Architecture Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Solidify the Bulletin codebase foundation across the DB layer, type system, route groups, data layer, and error handling before any Phase 2 UI work begins.

**Architecture:** All Supabase queries are funnelled through a typed service layer (`src/lib/data.ts`). Types are generated from the live schema via the Supabase CLI. The app is organised into four Next.js App Router route groups — `(public)`, `(auth)`, `(dashboard)`, `(admin)` — each with its own layout and error boundary.

**Tech Stack:** Next.js 16.2.3 (App Router), Supabase (PostgreSQL + RLS + Auth), TypeScript, `@supabase/ssr`, Tailwind CSS v4, shadcn/ui v4.2.0, Vercel.

**Spec:** `docs/superpowers/specs/2026-04-14-architecture-foundation-design.md`

---

## File Map

| File                                                   | Action   | Responsibility                                                        |
| ------------------------------------------------------ | -------- | --------------------------------------------------------------------- |
| `supabase/migrations/20260411000004_fixes.sql`         | Create   | Auth trigger, RLS fix, category corrections, Phase 3 schema additions |
| `src/lib/database.types.ts`                            | Generate | CLI-generated Supabase types — never hand-edited                      |
| `src/lib/types.ts`                                     | Rewrite  | Composition layer — raw DB types + joined view types                  |
| `src/lib/data.ts`                                      | Create   | All Supabase queries — public functions only this pass                |
| `src/app/layout.tsx`                                   | Modify   | Update metadata title + description                                   |
| `src/app/not-found.tsx`                                | Create   | Global 404 page                                                       |
| `src/app/page.tsx`                                     | Delete   | Replaced by `(public)/page.tsx`                                       |
| `src/app/(public)/layout.tsx`                          | Create   | Header + footer shell, no auth                                        |
| `src/app/(public)/page.tsx`                            | Create   | Feed page — calls data layer, minimal UI                              |
| `src/app/(public)/loading.tsx`                         | Create   | Skeleton for feed                                                     |
| `src/app/(public)/error.tsx`                           | Create   | Error boundary for public group                                       |
| `src/app/(public)/announcements/[id]/page.tsx`         | Create   | Detail page placeholder                                               |
| `src/app/(public)/announcements/[id]/loading.tsx`      | Create   | Skeleton for detail                                                   |
| `src/app/(auth)/layout.tsx`                            | Create   | Centered card layout, redirect if already authed                      |
| `src/app/(auth)/login/page.tsx`                        | Create   | Login page placeholder                                                |
| `src/app/(auth)/error.tsx`                             | Create   | Error boundary for auth group                                         |
| `src/app/(dashboard)/layout.tsx`                       | Create   | Sidebar nav, enforces auth                                            |
| `src/app/(dashboard)/page.tsx`                         | Create   | Publisher home placeholder                                            |
| `src/app/(dashboard)/announcements/page.tsx`           | Create   | Announcements list placeholder                                        |
| `src/app/(dashboard)/announcements/new/page.tsx`       | Create   | Create form placeholder                                               |
| `src/app/(dashboard)/announcements/[id]/edit/page.tsx` | Create   | Edit form placeholder                                                 |
| `src/app/(dashboard)/organization/page.tsx`            | Create   | Org settings placeholder                                              |
| `src/app/(dashboard)/error.tsx`                        | Create   | Error boundary for dashboard group                                    |
| `src/app/(admin)/layout.tsx`                           | Create   | Admin nav, enforces admin/super_admin role                            |
| `src/app/(admin)/page.tsx`                             | Create   | Admin home placeholder                                                |
| `src/app/(admin)/organizations/page.tsx`               | Create   | Org approvals placeholder                                             |
| `src/app/(admin)/users/page.tsx`                       | Create   | User management placeholder                                           |
| `src/app/(admin)/error.tsx`                            | Create   | Error boundary for admin group                                        |

---

## Task 1: Write Migration 004 SQL File

**Files:**

- Create: `supabase/migrations/20260411000004_fixes.sql`

> **AGENTS.md note:** This version of Next.js (16.2.3) and the Supabase stack may have breaking changes. Before touching any Next.js files in later tasks, read the guide at `node_modules/next/dist/docs/` — specifically the App Router routing and layouts sections.

- [ ] **Step 1: Create the migration file**

```sql
-- ============================================================
-- Bulletin — Fixes + Phase 3 Schema Additions
-- Run in Supabase SQL Editor after migration 003
-- ============================================================

-- ─── Fix 1: Auth trigger ─────────────────────────────────────
-- Auto-inserts a row into public.users when Supabase Auth creates
-- a new user. Without this, current_user_role() returns null for
-- all real users and the entire RLS system silently fails.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'publisher'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Fix 2: Publisher RLS WITH CHECK ─────────────────────────
-- The existing policy was missing a WITH CHECK clause — a publisher
-- could set status = 'expired' or change author_id on update.

drop policy if exists "announcements: publisher manage own drafts" on public.announcements;

create policy "announcements: publisher manage own drafts" on public.announcements
  for update
  using (
    author_id = auth.uid()
    and status in ('draft', 'published', 'archived')
  )
  with check (
    author_id = auth.uid()
    and status in ('draft', 'published', 'archived')
  );

-- ─── Fix 3: Correct category seeds ───────────────────────────
-- PRD §6.5 specifies: Clubs & Societies, Finance, Campus Life.
-- The original migration seeded: Sports, Student Life, Opportunities.

update public.categories
  set name = 'Clubs & Societies', slug = 'clubs-societies'
  where slug = 'sports';

update public.categories
  set name = 'Finance', slug = 'finance'
  where slug = 'student-life';

update public.categories
  set name = 'Campus Life', slug = 'campus-life'
  where slug = 'opportunities';

-- ─── Addition: org_type column ────────────────────────────────

alter table public.organizations
  add column if not exists org_type text
  check (org_type in ('club', 'department', 'society'));

-- ─── Addition: invitations table ─────────────────────────────

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        user_role not null default 'publisher',
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid not null references public.users(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy "invitations: admin manage" on public.invitations
  for all using (public.current_user_role() in ('admin', 'super_admin'));

-- ─── Addition: audit_log table ───────────────────────────────

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.users(id) on delete set null,
  action       text not null,
  target_table text,
  target_id    uuid,
  payload      jsonb,
  created_at   timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log: admin read" on public.audit_log
  for select using (public.current_user_role() in ('admin', 'super_admin'));

create policy "audit_log: service insert" on public.audit_log
  for insert with check (true);
```

Save this as `supabase/migrations/20260411000004_fixes.sql`.

- [ ] **Step 2: Commit the migration file**

```bash
git add supabase/migrations/20260411000004_fixes.sql
git commit -m "feat(db): migration 004 — auth trigger, RLS fix, category corrections, Phase 3 schema"
```

---

## Task 2: Run Migration 004 in Supabase

**Files:** None (manual step in Supabase dashboard)

- [ ] **Step 1: Open Supabase SQL Editor**

Go to: [supabase.com](https://supabase.com) → your project → **SQL Editor** → **New query**

- [ ] **Step 2: Paste and run the migration**

Copy the entire contents of `supabase/migrations/20260411000004_fixes.sql` and paste into the SQL Editor. Click **Run**.

Expected: green "Success. No rows returned" for each statement.

- [ ] **Step 3: Verify auth trigger exists**

Run this query in the SQL Editor:

```sql
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
```

Expected: one row with `on_auth_user_created` / `INSERT` / `users`.

- [ ] **Step 4: Verify category corrections**

```sql
select name, slug from public.categories order by name;
```

Expected names: `Academic`, `Campus Life`, `Clubs & Societies`, `Events`, `Finance`, `General`.

- [ ] **Step 5: Verify invitations + audit_log tables exist**

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('invitations', 'audit_log');
```

Expected: 2 rows.

---

## Task 3: Install Supabase CLI + Generate Types

**Files:**

- Modify: `package.json` (new devDependency)
- Create: `src/lib/database.types.ts` (generated)

- [ ] **Step 1: Install the Supabase CLI as a dev dependency**

```bash
npm install --save-dev supabase
```

Expected output: package added to `devDependencies` in `package.json`.

- [ ] **Step 2: Get your Supabase project reference ID**

Go to: Supabase dashboard → your project → **Settings** → **General** → copy **Reference ID**.

It looks like: `cbjhmsangqmlwryvuvap` (20 character string).

- [ ] **Step 3: Generate the TypeScript types**

Replace `<YOUR_PROJECT_REF>` with your actual reference ID:

```bash
npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/lib/database.types.ts
```

- [ ] **Step 4: Verify the generated file**

Open `src/lib/database.types.ts`. It should contain a `Database` type with `public.Tables` that includes at minimum: `announcements`, `categories`, `organizations`, `organization_members`, `users`, `invitations`, `audit_log`.

Check for the `announcements` table:

```bash
grep -n "announcements" src/lib/database.types.ts
```

Expected: multiple matches including `Row`, `Insert`, `Update` types.

- [ ] **Step 5: Add a generation script to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"types:gen": "supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/lib/database.types.ts"
```

Run this script after every future migration with `npm run types:gen`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/database.types.ts package.json package-lock.json
git commit -m "chore: install supabase CLI + generate database.types.ts from live schema"
```

---

## Task 4: Rewrite src/lib/types.ts

**Files:**

- Modify: `src/lib/types.ts`

- [ ] **Step 1: Replace the entire file with the composition layer**

```typescript
import type { Database } from './database.types'

// ─── Raw DB row types ─────────────────────────────────────────
// These mirror the exact shape of each Supabase table row.
// Generated via: npm run types:gen

export type DbAnnouncement = Database['public']['Tables']['announcements']['Row']
export type DbOrganization = Database['public']['Tables']['organizations']['Row']
export type DbCategory = Database['public']['Tables']['categories']['Row']
export type DbUser = Database['public']['Tables']['users']['Row']
export type DbInvitation = Database['public']['Tables']['invitations']['Row']
export type DbAuditLog = Database['public']['Tables']['audit_log']['Row']

// ─── Input types ─────────────────────────────────────────────
// Used by data.ts mutation functions (Phase 3+)

export type InsertAnnouncement = Database['public']['Tables']['announcements']['Insert']
export type UpdateAnnouncement = Database['public']['Tables']['announcements']['Update']

// ─── View types ───────────────────────────────────────────────
// Joined shapes returned by data.ts — components import these.

export type AnnouncementWithRelations = DbAnnouncement & {
  categories: DbCategory | null
  organizations: DbOrganization
}
```

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see errors about missing properties in `database.types.ts`, re-run `npm run types:gen` — the generated file may be stale.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "refactor(types): rewrite as CLI-generated composition layer"
```

---

## Task 5: Scaffold (public) Route Group

**Files:**

- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/(public)/page.tsx` (minimal placeholder — replaced in Task 10)
- Create: `src/app/(public)/loading.tsx`
- Create: `src/app/(public)/error.tsx`
- Create: `src/app/(public)/announcements/[id]/page.tsx`
- Create: `src/app/(public)/announcements/[id]/loading.tsx`

> Before writing: check `node_modules/next/dist/docs/` for the route-groups and layouts guide. Pay attention to how `layout.tsx` wraps `children` and how `error.tsx` must be a Client Component.

- [ ] **Step 1: Create `src/app/(public)/layout.tsx`**

```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b px-6 py-4">
        <span className="font-semibold tracking-tight">Bulletin</span>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="text-muted-foreground border-t px-6 py-4 text-sm">
        INTI International University
      </footer>
    </>
  )
}
```

- [ ] **Step 2: Create `src/app/(public)/page.tsx`** (temporary placeholder — overwritten in Task 10)

```tsx
export default function FeedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Announcements</h1>
      <p className="text-muted-foreground mt-2">Feed coming in Phase 2.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(public)/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/(public)/error.tsx`**

```tsx
'use client'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Something went wrong.</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/(public)/announcements/[id]/page.tsx`**

```tsx
export default function AnnouncementDetailPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-muted-foreground">Detail page coming in Phase 2.</p>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/app/(public)/announcements/[id]/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="bg-muted h-8 w-2/3 animate-pulse rounded" />
      <div className="bg-muted mt-4 h-64 animate-pulse rounded-lg" />
    </div>
  )
}
```

- [ ] **Step 7: Delete the old page.tsx**

```bash
rm src/app/page.tsx
```

- [ ] **Step 8: Start dev server and verify `/` renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Expected: "Announcements — Feed coming in Phase 2." with the Bulletin header and INTI footer visible. No 404, no console errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(public\)/
git rm src/app/page.tsx
git commit -m "feat(routes): scaffold (public) route group with layout, placeholders, error + loading"
```

---

## Task 6: Scaffold (auth) Route Group

**Files:**

- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/error.tsx`

- [ ] **Step 1: Create `src/app/(auth)/layout.tsx`**

This layout redirects already-authenticated users away from login.

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return <div className="flex min-h-full items-center justify-center px-4 py-12">{children}</div>
}
```

- [ ] **Step 2: Create `src/app/(auth)/login/page.tsx`**

```tsx
export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-lg border p-8">
      <h1 className="mb-6 text-xl font-semibold">Sign in to Bulletin</h1>
      <p className="text-muted-foreground text-sm">Login form coming in Phase 3.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(auth)/error.tsx`**

```tsx
'use client'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Authentication error.</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Verify `/login` renders**

Navigate to `http://localhost:3000/login`. Expected: the centered card with "Sign in to Bulletin". No errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat(routes): scaffold (auth) route group with redirect-if-authed layout"
```

---

## Task 7: Scaffold (dashboard) Route Group

**Files:**

- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/app/(dashboard)/announcements/page.tsx`
- Create: `src/app/(dashboard)/announcements/new/page.tsx`
- Create: `src/app/(dashboard)/announcements/[id]/edit/page.tsx`
- Create: `src/app/(dashboard)/organization/page.tsx`
- Create: `src/app/(dashboard)/error.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/layout.tsx`**

Enforces authentication. Org membership check added in Phase 3.

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-full">
      <aside className="w-56 shrink-0 border-r px-4 py-6">
        <p className="text-muted-foreground mb-4 text-xs font-medium tracking-widest uppercase">
          Publisher
        </p>
        <nav className="space-y-1">
          <a href="/dashboard" className="hover:bg-muted block rounded px-3 py-2 text-sm">
            Home
          </a>
          <a
            href="/dashboard/announcements"
            className="hover:bg-muted block rounded px-3 py-2 text-sm"
          >
            Announcements
          </a>
          <a
            href="/dashboard/organization"
            className="hover:bg-muted block rounded px-3 py-2 text-sm"
          >
            Organization
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/(dashboard)/page.tsx`**

```tsx
export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Publisher Dashboard</h1>
      <p className="text-muted-foreground mt-2">Dashboard content coming in Phase 3.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(dashboard)/announcements/page.tsx`**

```tsx
export default function MyAnnouncementsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">My Announcements</h1>
      <p className="text-muted-foreground mt-2">Coming in Phase 3.</p>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/(dashboard)/announcements/new/page.tsx`**

```tsx
export default function NewAnnouncementPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">New Announcement</h1>
      <p className="text-muted-foreground mt-2">Form coming in Phase 3.</p>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/(dashboard)/announcements/[id]/edit/page.tsx`**

```tsx
export default function EditAnnouncementPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit Announcement</h1>
      <p className="text-muted-foreground mt-2">Form coming in Phase 3.</p>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/app/(dashboard)/organization/page.tsx`**

```tsx
export default function OrganizationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Organization</h1>
      <p className="text-muted-foreground mt-2">Settings coming in Phase 3.</p>
    </div>
  )
}
```

- [ ] **Step 7: Create `src/app/(dashboard)/error.tsx`**

```tsx
'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Something went wrong.</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Verify `/dashboard` redirects to `/login`** (since you're not logged in)

Navigate to `http://localhost:3000/dashboard`. Expected: redirect to `http://localhost:3000/login`. No errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(dashboard\)/
git commit -m "feat(routes): scaffold (dashboard) route group with auth guard + sidebar layout"
```

---

## Task 8: Scaffold (admin) Route Group

**Files:**

- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/page.tsx`
- Create: `src/app/(admin)/organizations/page.tsx`
- Create: `src/app/(admin)/users/page.tsx`
- Create: `src/app/(admin)/error.tsx`

- [ ] **Step 1: Create `src/app/(admin)/layout.tsx`**

Enforces auth + admin/super_admin role. Reads role from `public.users` (RLS allows reading own row).

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-full">
      <aside className="w-56 shrink-0 border-r px-4 py-6">
        <p className="text-muted-foreground mb-4 text-xs font-medium tracking-widest uppercase">
          Admin
        </p>
        <nav className="space-y-1">
          <a href="/admin" className="hover:bg-muted block rounded px-3 py-2 text-sm">
            Home
          </a>
          <a href="/admin/organizations" className="hover:bg-muted block rounded px-3 py-2 text-sm">
            Organizations
          </a>
          <a href="/admin/users" className="hover:bg-muted block rounded px-3 py-2 text-sm">
            Users
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
```

> **Note:** After running migration 004, manually set your own user's role to `super_admin` in the Supabase Table Editor (Table: `users`, column: `role`). This must be done before you can access `/admin`.

- [ ] **Step 2: Create `src/app/(admin)/page.tsx`**

```tsx
export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-2">Admin tools coming in Phase 4.</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(admin)/organizations/page.tsx`**

```tsx
export default function AdminOrganizationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <p className="text-muted-foreground mt-2">Approval queue coming in Phase 4.</p>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/(admin)/users/page.tsx`**

```tsx
export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="text-muted-foreground mt-2">User management coming in Phase 4.</p>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/(admin)/error.tsx`**

```tsx
'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Something went wrong.</p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
      >
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Verify `/admin` redirects to `/login`** (not logged in)

Navigate to `http://localhost:3000/admin`. Expected: redirect to `/login`. No errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(admin\)/
git commit -m "feat(routes): scaffold (admin) route group with role guard + admin layout"
```

---

## Task 9: Write Public Data Functions in src/lib/data.ts

**Files:**

- Create: `src/lib/data.ts`

- [ ] **Step 1: Create `src/lib/data.ts` with the three public functions**

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { AnnouncementWithRelations, DbCategory } from '@/lib/types'

// ─── Public — no auth required ────────────────────────────────

/**
 * Returns published, non-expired announcements in reverse chronological order.
 * Optionally filtered by category slug. Paginated at 20 per page.
 */
export async function getPublicAnnouncements(options?: {
  categorySlug?: string
  page?: number
}): Promise<AnnouncementWithRelations[]> {
  const supabase = await createClient()
  const page = options?.page ?? 1
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1
  const now = new Date().toISOString()

  let query = supabase
    .from('announcements')
    .select('*, categories(*), organizations(*)')
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })
    .range(from, to)

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single()

    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data ?? []) as AnnouncementWithRelations[]
}

/**
 * Returns a single published announcement by ID.
 * Calls notFound() if the announcement does not exist or is not published.
 */
export async function getAnnouncementById(id: string): Promise<AnnouncementWithRelations> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*, categories(*), organizations(*)')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !data) notFound()
  return data as AnnouncementWithRelations
}

/**
 * Returns all active categories sorted by name.
 */
export async function getActiveCategories(): Promise<DbCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return data
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see type errors on the `as AnnouncementWithRelations[]` cast, check that `database.types.ts` contains the `announcements`, `categories`, and `organizations` tables — regenerate if stale.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat(data): add public service layer — getPublicAnnouncements, getAnnouncementById, getActiveCategories"
```

---

## Task 10: Wire Feed Page to Data Layer + Global Pages

**Files:**

- Modify: `src/app/(public)/page.tsx` (replace placeholder with real data call)
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Replace `src/app/(public)/page.tsx` with the data-connected version**

> **Next.js 16 note:** `searchParams` is a Promise in this version. Always `await` it.

```tsx
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [announcements, categories] = await Promise.all([
    getPublicAnnouncements({ categorySlug: category }),
    getActiveCategories(),
  ])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Announcements</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        {category ? ` in "${category}"` : ''}
      </p>

      {/* Category list — Phase 2 will turn this into filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/?category=${cat.slug}`}
            className="hover:bg-muted rounded-full border px-3 py-1 text-xs"
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Announcement list — Phase 2 will replace this with AnnouncementCard components */}
      {announcements.length === 0 ? (
        <p className="text-muted-foreground">No announcements found.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">{a.organizations.name}</p>
              <a href={`/announcements/${a.id}`} className="mt-1 block font-medium hover:underline">
                {a.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 py-24">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page does not exist.</p>
      <a href="/" className="mt-2 text-sm underline underline-offset-4">
        Back to announcements
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Verify the feed page loads**

Navigate to `http://localhost:3000`. Expected: "Announcements" heading, category filter links (Academic, Campus Life, Clubs & Societies, Events, Finance, General), and either a list of announcements or "No announcements found." No console errors, no TypeScript errors.

- [ ] **Step 4: Verify category filter works**

Navigate to `http://localhost:3000/?category=events`. Expected: same page, filtered. No 500 errors even if no announcements exist.

- [ ] **Step 5: Verify 404 page**

Navigate to `http://localhost:3000/does-not-exist`. Expected: the 404 page with "Back to announcements" link.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/page.tsx src/app/not-found.tsx
git commit -m "feat(public): wire feed page to data layer, add global not-found"
```

---

## Task 11: Update Root Layout Metadata + Final Type Check

**Files:**

- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update the metadata in `src/app/layout.tsx`**

Replace the existing `metadata` export:

```tsx
export const metadata: Metadata = {
  title: 'Bulletin — INTI International University',
  description: 'The official announcement platform for INTI International University.',
}
```

- [ ] **Step 2: Run final TypeScript check across the whole project**

```bash
npx tsc --noEmit
```

Expected: zero errors. Fix any before proceeding.

- [ ] **Step 3: Run Prettier format check**

```bash
npm run format:check
```

If it reports files to fix, run:

```bash
npm run format
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore: update root layout metadata for Bulletin"
```

---

## Task 12: Tag checkpoint-2-foundation

- [ ] **Step 1: Confirm dev server is clean**

```bash
npm run build
```

Expected: build completes with no errors. Check for any TypeScript or ESLint failures in the build output.

- [ ] **Step 2: Confirm all routes respond**

With `npm run dev` running, visit each route and confirm no 500 errors:

- `http://localhost:3000/` — feed page
- `http://localhost:3000/login` — login card
- `http://localhost:3000/dashboard` — redirects to `/login`
- `http://localhost:3000/admin` — redirects to `/login`
- `http://localhost:3000/nonexistent` — 404 page

- [ ] **Step 3: Tag and push**

```bash
git tag -a checkpoint-2-foundation -m "Architecture foundation complete: auth trigger, RLS fixes, CLI types, 4 route groups, data service layer"
git push origin main
git push origin checkpoint-2-foundation
```

Expected: tag visible on GitHub at `github.com/Osman6202/Bulletin/tags`.

---

## Self-Review

| Spec Requirement                                  | Covered By      |
| ------------------------------------------------- | --------------- |
| Auth trigger (migration 004)                      | Task 1 + Task 2 |
| Publisher RLS WITH CHECK fix                      | Task 1 + Task 2 |
| Category seed corrections                         | Task 1 + Task 2 |
| `org_type` column                                 | Task 1 + Task 2 |
| `invitations` table                               | Task 1 + Task 2 |
| `audit_log` table                                 | Task 1 + Task 2 |
| CLI-generated `database.types.ts`                 | Task 3          |
| `types.ts` composition layer                      | Task 4          |
| `(public)` route group + layout + error + loading | Task 5          |
| `(auth)` route group + redirect-if-authed         | Task 6          |
| `(dashboard)` route group + auth guard            | Task 7          |
| `(admin)` route group + role guard                | Task 8          |
| `src/lib/data.ts` public functions                | Task 9          |
| Feed page wired to data layer                     | Task 10         |
| `not-found.tsx`                                   | Task 10         |
| Root layout metadata                              | Task 11         |
| `checkpoint-2-foundation` git tag                 | Task 12         |

All spec requirements covered. No placeholders or TBDs remaining.
