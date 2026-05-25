# Bulletin — Architecture Foundation Design

**Date:** 2026-04-14
**Status:** Approved
**Phase:** Pre-Phase-2 (foundation solidification)
**Author:** Maaney

---

## Context

Bulletin is a centralized university announcement platform for INTI International University. Phase 0 (scaffold) and Phase 1 (Supabase infrastructure) are complete. Before building Phase 2 (public feed), a full architecture foundation audit was conducted. This document captures the agreed design for solidifying the foundation across all layers.

---

## Decisions Made

| Layer          | Decision                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| Data access    | Service layer — all queries in `src/lib/data.ts`, components never call Supabase directly |
| Type system    | Supabase CLI-generated `database.types.ts` + hand-authored `types.ts` composition layer   |
| Route groups   | Four groups: `(public)`, `(auth)`, `(dashboard)`, `(admin)`                               |
| Error handling | Throw on error in service layer + Next.js `error.tsx` per route group                     |

---

## Section 1 — Database Layer Fixes

### Migration: `20260411000004_fixes.sql`

**Fix 1 — Auth trigger (Blocker)**
A `AFTER INSERT ON auth.users` trigger that auto-inserts a row into `public.users` when Supabase Auth creates a user. Without this, `current_user_role()` returns null for all real users and the entire RLS system silently fails.

**Fix 2 — Publisher RLS `WITH CHECK` (Security)**
The `"announcements: publisher manage own drafts"` policy is missing a `WITH CHECK` clause. A publisher can currently set `status = 'expired'` or change `organization_id` on update. Fixed by adding:

```sql
WITH CHECK (
  author_id = auth.uid()
  AND status IN ('draft', 'published', 'archived')
  AND organization_id = (
    SELECT organization_id FROM public.announcements WHERE id = announcements.id
  )
)
```

**Fix 3 — Category seeds (Wrong data)**
Three categories were seeded incorrectly vs PRD §6.5. UPDATE statements correct them:

- `Sports` → `Clubs & Societies` (slug: `clubs-societies`)
- `Student Life` → `Finance` (slug: `finance`)
- `Opportunities` → `Campus Life` (slug: `campus-life`)

**Phase 3 schema additions (added now, cheap before UI exists)**

- `org_type` column on `organizations` (`text`, values: `'club' | 'department' | 'society'`)
- `invitations` table: `email`, `role`, `token`, `expires_at`, `used_at`
- `audit_log` table: `actor_id`, `action`, `target_table`, `target_id`, `payload jsonb`, `created_at`

---

## Section 2 — Type System

### File structure

```
src/lib/
  database.types.ts   ← CLI-generated, committed to git, never hand-edited
  types.ts            ← Hand-authored composition layer, imported by all components
```

### Generation command

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

Run after every migration. Commit the result.

### `types.ts` composition pattern

```ts
import type { Database } from './database.types'

// Raw DB row types
export type DbAnnouncement = Database['public']['Tables']['announcements']['Row']
export type DbOrganization = Database['public']['Tables']['organizations']['Row']
export type DbCategory = Database['public']['Tables']['categories']['Row']
export type DbUser = Database['public']['Tables']['users']['Row']

// View types — shaped for components, with joins resolved
export type AnnouncementWithRelations = DbAnnouncement & {
  categories: DbCategory | null
  organizations: DbOrganization
}
```

Components import from `src/lib/types.ts` only — never directly from `database.types.ts`.

---

## Section 3 — Route Group Structure

```
src/app/
  layout.tsx                        ← Root: fonts, body, globals.css only
  globals.css
  not-found.tsx                     ← Global 404

  (public)/
    layout.tsx                      ← Header + Footer, no auth required
    page.tsx                        ← Announcement feed
    announcements/
      [id]/
        page.tsx                    ← Detail view
        loading.tsx
    loading.tsx
    error.tsx

  (auth)/
    layout.tsx                      ← Centered card layout, redirects if already authed
    login/
      page.tsx
    error.tsx

  (dashboard)/
    layout.tsx                      ← Sidebar nav, enforces auth + org membership
    page.tsx                        ← Publisher home
    announcements/
      page.tsx                      ← My announcements list
      new/
        page.tsx                    ← Create form
      [id]/
        edit/
          page.tsx                  ← Edit form
    organization/
      page.tsx                      ← Org settings
    error.tsx

  (admin)/
    layout.tsx                      ← Admin nav, enforces admin/super_admin role
    page.tsx                        ← Admin home
    organizations/
      page.tsx                      ← Pending approvals queue
    users/
      page.tsx                      ← User list + role management
    error.tsx
```

### Role enforcement rule

- Middleware: auth check only (already implemented)
- `(dashboard)/layout.tsx`: server-side check for auth + org membership → redirect if missing
- `(admin)/layout.tsx`: server-side check for `admin` or `super_admin` role → redirect if missing

---

## Section 4 — Data Layer

**File:** `src/lib/data.ts`

All Supabase queries live here. Functions throw on error. Components call functions, never `createClient()`.

### Public functions (no auth required — Phase 2)

```ts
getPublicAnnouncements(options?: { categorySlug?: string; page?: number }): Promise<AnnouncementWithRelations[]>
getAnnouncementById(id: string): Promise<AnnouncementWithRelations>   // calls notFound() if missing
getActiveCategories(): Promise<DbCategory[]>
```

### Publisher functions (auth + org required — Phase 3)

```ts
getMyAnnouncements(userId: string): Promise<DbAnnouncement[]>
createAnnouncement(data: CreateAnnouncementInput): Promise<DbAnnouncement>
updateAnnouncement(id: string, data: UpdateAnnouncementInput): Promise<DbAnnouncement>
publishAnnouncement(id: string): Promise<void>
archiveAnnouncement(id: string): Promise<void>
```

### Admin functions (admin role required — Phase 4)

```ts
getPendingOrganizations(): Promise<DbOrganization[]>
approveOrganization(id: string, adminId: string): Promise<void>
rejectOrganization(id: string, adminId: string, reason: string): Promise<void>
getAllUsers(): Promise<DbUser[]>
updateUserRole(id: string, role: DbUser['role']): Promise<void>
```

### Convention

```ts
export async function getActiveCategories(): Promise<DbCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').select('*').eq('is_active', true)

  if (error) throw new Error(error.message)
  return data
}
```

Phase 2 implements public functions only. Publisher and admin functions are written when those phases are built.

---

## Section 5 — Error Handling + Loading States

### `error.tsx` pattern (Client Component, per route group)

```tsx
'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>Something went wrong.</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

Styled properly in Phase 2. Structure is what matters now.

### Not found

`getAnnouncementById` calls `notFound()` from `next/navigation` for missing rows — surfaces global `not-found.tsx`, not an error boundary.

### Loading states

Each data-fetching page gets a `loading.tsx` sibling with skeleton placeholders. Enables React Suspense streaming.

### Out of scope for this foundation pass

- Toast notifications — Phase 3
- Optimistic UI — Phase 3
- Retry logic — not needed at this scale

---

## Implementation Order

1. Run `20260411000004_fixes.sql` in Supabase SQL Editor
2. Install Supabase CLI + generate `database.types.ts`
3. Rewrite `src/lib/types.ts` as composition layer
4. Scaffold route group folder structure + layout shells
5. Write public data functions in `src/lib/data.ts`
6. Add `error.tsx` + `loading.tsx` to each route group
7. Move current `page.tsx` content into `(public)/page.tsx`
8. Update `layout.tsx` metadata (title, description)
9. Tag `checkpoint-2-foundation` in git
