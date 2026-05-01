# Bulletin — Session Handoff
> Last updated: 2026-04-28 | Pick up from here next session.

---

## Project Identity
- **App:** Bulletin — INTI International University announcement platform
- **Repo:** github.com/Osman6202/Bulletin
- **Live:** bulletin-l2ai.vercel.app
- **Stack:** Next.js 16.2.3 (App Router, TS, Turbopack) · Tailwind v4 · Supabase · Vercel
- **Active branch (dashboard):** `feature/phase-3-dashboard`
- **Worktree path:** `C:\Users\cusma\projects\Bulletin\.worktrees\phase-3-dashboard`
- **Main branch:** `main` — Phase 4 UI redesign complete (Playfair Display, warm palette, featured card)

---

## What's Done

| Phase | Status |
|-------|--------|
| Phase 0 — Scaffold + Supabase + Vercel | ✅ checkpoint-0 |
| Phase 1.5 — Architecture foundation | ✅ checkpoint-2-foundation |
| Phase 2 — Public feed + detail page | ✅ checkpoint-3 |
| Phase 3 Task 1 — Fonts, tokens, ThemeProvider | ✅ |
| Phase 3 Task 2 — Shared dashboard components | ✅ |
| Phase 3 Task 3 — Login page redesign | ✅ 1ab83db |
| Phase 3 Task 4 — Dashboard home | ✅ |
| Phase 3 Task 5 — Announcements list page | ✅ fc05e00 (all 4 quality bugs fixed) |
| Phase 3 Task 6 — Create & Edit forms | ❌ NOT STARTED |
| Phase 3 Task 7 — Animations & polish | ❌ NOT STARTED |
| Phase 4 — UI redesign (main branch) | ✅ COMPLETE |

### Phase 4 Complete (main branch)
- Playfair Display headings + DM Sans body via `next/font/google`
- Warm cream palette: canvas `#FAF9F7`, border `#E8E2D9`, text `#1A1614`
- Dark mode: canvas `#0F0E0D`, surface `#1C1917`
- INTI brand: red `#C8102E`, gold `#D4941F`, navy `#002147`
- Frosted glass sticky header + gradient B logo mark
- Featured horizontal card (first item) + 2-column grid (rest)
- Shimmer skeleton loading page
- Spring cubic-bezier(0.16, 1, 0.3, 1) transitions everywhere
- min-h-[100dvh] (mobile viewport safe)
- `data.ts`: errors now graceful (return [] instead of throw)

---

## Immediate Next Task: Task 6 — Create & Edit Forms

**Working in:** `.worktrees/phase-3-dashboard/`

**Files to create (in order):**
1. `src/components/dashboard/AutosaveIndicator.tsx`
2. `src/components/dashboard/ActionBar.tsx`
3. `src/app/(dashboard)/announcements/new/actions.ts`
4. `src/app/(dashboard)/announcements/[id]/edit/actions.ts`
5. `src/components/dashboard/AnnouncementForm.tsx`
6. `src/app/(dashboard)/announcements/new/page.tsx`
7. `src/app/(dashboard)/announcements/[id]/edit/page.tsx`

**Note:** `new/` and `[id]/` directories already exist but are empty.

### Form Spec (from planning/phase-3-dashboard/plan.md)
- Max-width 720px, centered, px-6 py-8
- Fields: title (text-xl, border-b only, char count 0/120), body (auto-grow textarea), category (custom select with colored dot), banner (drag-drop → Supabase Storage `announcement-banners`), registration_link (URL validate on blur), expires_at (date input)

### ActionBar Spec
- Sticky bottom, `bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-[var(--color-border)]`
- Left: AutosaveIndicator + status badge
- Right: "Save Draft" ghost + "Publish" solid accent
- If editing published: "Save Changes" solid + "Unpublish" ghost destructive

### AutosaveIndicator Spec
- States: idle → saving ("Saving..." spinner) → saved ("Saved ✓" fades 2s) → error
- Triggers: dirty + 30s OR explicit save click

### Server Actions
```ts
// new/actions.ts
createAnnouncement(formData: FormFields): Promise<{ id: string }>

// [id]/edit/actions.ts
updateAnnouncement(id: string, formData: FormFields): Promise<void>
publishAnnouncement(id: string): Promise<void>
unpublishAnnouncement(id: string): Promise<void>
deleteAnnouncement(id: string): Promise<void>
```

All actions:
1. `await createClient()` from `@/lib/supabase/server`
2. Get user: `supabase.auth.getUser()`
3. Get org: `supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()`
4. Verify `announcement.organization_id === orgId` before mutating

### Pattern for Passing Server Actions to Client Form
```tsx
// new/page.tsx (Server Component)
import { createAnnouncement } from './actions'
<AnnouncementForm onSave={createAnnouncement} />

// [id]/edit/page.tsx (Server Component)
import { updateAnnouncement } from './actions'
const boundUpdate = updateAnnouncement.bind(null, id)
<AnnouncementForm initialData={announcement} onSave={boundUpdate} onPublish={...} />
```

---

## After Task 6: Task 7 — Animations & Polish
See `planning/phase-3-dashboard/plan.md` → Task 7.
Key items: entry animations, mobile sidebar drawer, tab underline transition, autosave SVG draw animation, prefers-reduced-motion guard.

---

## Key Files Reference

```
.worktrees/phase-3-dashboard/src/
  app/
    (dashboard)/
      announcements/
        new/                              ← empty, create page.tsx + actions.ts
        [id]/                             ← empty, create edit/page.tsx + actions.ts
        AnnouncementsClient.tsx
        page.tsx
      dashboard/page.tsx
    (auth)/login/page.tsx
    globals.css                           ← dashboard CSS tokens (different from main)
  components/
    dashboard/
      AnnouncementRow.tsx
      DashboardShell.tsx                  ← pl-64 pt-16 fixed layout
      DashboardSidebar.tsx
      DashboardTopNav.tsx
      GlassCard.tsx
      StatusBadge.tsx
  lib/
    data.ts
    types.ts
    database.types.ts                     ← DO NOT EDIT
    supabase/
      server.ts                           ← async createClient() for server
      client.ts                           ← createClient() for browser (file uploads)

main branch src/
  app/(public)/page.tsx                   ← public feed (Phase 4 complete)
  app/globals.css                         ← warm editorial tokens
  lib/data.ts                             ← graceful error handling (no throw)
```

---

## CSS Token Reference (Dashboard worktree)

| Token | Value |
|-------|-------|
| `--color-canvas` | `#FFF7F7` |
| `--color-surface` | `#FFFFFF` |
| `--color-surface-elevated` | `#FFF0F0` |
| `--color-border` | `#F5C6C6` |
| `--color-text-primary` | `#1A0505` |
| `--color-text-muted` | `#A07070` |
| `--color-accent` | `#EC2028` |
| `--color-accent-hover` | `#C41920` |
| `--color-accent-surface` | `#FEE8E8` |
| `--color-glass-bg` | `rgba(255,255,255,0.75)` |
| `--color-glass-border` | `rgba(236,32,40,0.12)` |

---

## DB Schema (key tables)

```sql
announcements (
  id uuid, title text, body text,
  banner_url text,                          -- optional, Supabase Storage URL
  status post_status,                       -- draft | published | expired | archived
  category_id uuid → categories,
  organization_id uuid → organizations,
  author_id uuid → users,
  registration_link text,
  published_at timestamptz,
  expires_at timestamptz,
)

organization_members (
  user_id uuid → users,
  organization_id uuid → organizations
)

categories ( id, name, slug, color, is_active )
```

---

## Known Issues / Gotchas
- Dashboard branch uses `--color-accent: #EC2028` (slightly different from main's `#C8102E`)
- DashboardShell hardcodes `pl-64 pt-16` — sidebar collapse/hide is Task 7 work
- `post_status` enum: `draft | published | expired | archived`; StatusBadge only handles `draft | published | archived` — `expired` must be mapped to `archived` via `satisfies`
- Middleware uses deprecated `middleware` filename convention — rename to `proxy` eventually
- Supabase free tier auto-pauses — resume at supabase.com/dashboard if 521 errors appear
- Tailwind v4 in dashboard worktree — `@theme inline` in globals.css, no tailwind.config.ts
