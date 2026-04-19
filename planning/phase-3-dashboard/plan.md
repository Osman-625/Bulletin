# Bulletin Phase 3 — Publisher Dashboard Implementation Plan

## Overview

Build the publisher dashboard for Bulletin (INTI International University's announcement platform).
This is a modern, minimalist workspace for publishers to create, manage, and publish announcements.

The dashboard has two visual modes: Light (INTI red brand, clean white surfaces) and Dark (Glacier OS
aesthetic — deep navy, glass morphism, INTI red accent). Mode is system-auto by default with a manual
toggle in the sidebar. Uses Geist + Geist Mono fonts.

Reference design: Glacier OS HTML mockup provided by developer (glass cards, rounded-2xl, backdrop-blur,
fixed sidebar + topnav, FAB button, stat bento grid).

---

## Task 1 — Foundation: Fonts, Theme System, Global CSS

**What:** Set up Geist fonts, install next-themes, and write the complete dual-mode color token system
into globals.css. Also update the existing public feed components to use INTI red instead of the old
forest green.

**Why:** Everything else depends on this being correct first. Colors, fonts, and theme classes must
be in place before any component can be built.

**Files to create/modify:**
- `package.json` — add `next-themes`
- `src/app/layout.tsx` — replace Newsreader + Roboto with Geist + Geist Mono using next/font/google
- `src/app/globals.css` — add CSS custom properties for both light and dark token sets, update
  existing color values to use tokens
- `src/components/layout/Header.tsx` — replace all `#1B4332` occurrences with `#EC2028`
- `src/components/announcements/AnnouncementCard.tsx` — replace all `#1B4332` occurrences with `#EC2028`

**Implementation notes:**

Install next-themes:
```
npm install next-themes
```

In layout.tsx, import Geist and Geist Mono from next/font/google. Set CSS variables
`--font-sans` (Geist) and `--font-mono` (Geist Mono). Keep the existing `--font-display`
variable name but point it to Geist for the dashboard (public feed can keep Newsreader via
its own override if needed, but for now global change is fine).

In globals.css, add these CSS custom properties under `:root` (light mode defaults):
```
--color-canvas: #FFF7F7;
--color-surface: #FFFFFF;
--color-surface-elevated: #FFF0F0;
--color-border: #F5C6C6;
--color-border-subtle: #FAE0E0;
--color-text-primary: #1A0505;
--color-text-secondary: #7A2828;
--color-text-muted: #A07070;
--color-accent: #EC2028;
--color-accent-hover: #C41920;
--color-accent-surface: #FEE8E8;
--color-secondary-accent: #F78B53;
--color-glass-bg: rgba(255, 255, 255, 0.75);
--color-glass-border: rgba(236, 32, 40, 0.12);
--color-destructive: #B91C1C;
--color-status-published-text: #15803D;
--color-status-published-bg: #DCFCE7;
--color-status-draft-text: #92400E;
--color-status-draft-bg: #FEF3C7;
--color-status-archived-text: #525252;
--color-status-archived-bg: #F3F4F6;
```

Under `.dark`:
```
--color-canvas: #0A0E1A;
--color-surface: #0F1524;
--color-surface-elevated: #141C2E;
--color-surface-high: #1A2438;
--color-border: rgba(236, 32, 40, 0.12);
--color-border-subtle: rgba(236, 32, 40, 0.06);
--color-text-primary: #F0E8E8;
--color-text-secondary: #C4A4A4;
--color-text-muted: #8B6B6B;
--color-accent: #FF5A5F;
--color-accent-hover: #FF7A7E;
--color-accent-surface: rgba(255, 90, 95, 0.10);
--color-secondary-accent: #F78B53;
--color-glass-bg: rgba(15, 21, 36, 0.60);
--color-glass-border: rgba(255, 90, 95, 0.10);
--color-destructive: #FF6B6B;
--color-status-published-text: #4ADE80;
--color-status-published-bg: rgba(74, 222, 128, 0.10);
--color-status-draft-text: #F78B53;
--color-status-draft-bg: rgba(247, 139, 83, 0.10);
--color-status-archived-text: #64748B;
--color-status-archived-bg: rgba(100, 116, 139, 0.10);
```

Tailwind v4 uses `@theme inline` to map CSS vars to utilities. Add the new color tokens there.
Also set darkMode to use `class` strategy (next-themes applies `dark` class to `<html>`).

The ThemeProvider from next-themes should be added in the root layout but configured with
`attribute="class"` and `defaultTheme="system"` and `enableSystem`.

**Tests:** No unit tests for this task. Manual verification: confirm light mode renders warm
white bg + red accents, dark mode renders deep navy + brighter red accents. Confirm font
renders as Geist.

---

## Task 2 — Shared Dashboard Components

**What:** Build the reusable shell components that every dashboard page uses:
DashboardSidebar, DashboardTopNav, DashboardShell, GlassCard, StatusBadge, ThemeToggle.

**Why:** These are the foundation of every dashboard page. Building them first means pages
can be assembled quickly in Tasks 3–7.

**Files to create:**
- `src/components/dashboard/DashboardShell.tsx` — layout wrapper
- `src/components/dashboard/DashboardSidebar.tsx` — fixed left sidebar
- `src/components/dashboard/DashboardTopNav.tsx` — fixed top bar
- `src/components/dashboard/GlassCard.tsx` — theme-aware glass card wrapper
- `src/components/dashboard/StatusBadge.tsx` — status pill
- `src/components/dashboard/ThemeToggle.tsx` — sun/moon toggle button

**Files to modify:**
- `src/app/(dashboard)/layout.tsx` — use DashboardShell, wrap with ThemeProvider if not global

**DashboardSidebar spec:**
- Fixed left, `w-64`, full height, `z-40`
- Dark: `bg-slate-950/75 backdrop-blur-2xl border-r border-[var(--color-border)]`
- Light: `bg-white/80 backdrop-blur-xl border-r border-[var(--color-border)]`
- Top: "BULLETIN" wordmark in Geist, small, uppercase, tracking-widest + "INTI International University" subtext
- Nav items: Home (links to `/dashboard`), Announcements (`/dashboard/announcements`), New Announcement (`/dashboard/announcements/new`)
- Each nav item: icon (use Lucide or Material Symbols) + label, `rounded-xl`, active state uses `var(--color-accent-surface)` bg + `var(--color-accent)` text
- Bottom section: ThemeToggle button + user display_name + role + logout form
- Mobile: drawer behavior (hidden by default, hamburger in topnav opens it)

**DashboardTopNav spec:**
- Fixed top, `h-16`, `left-64` offset, `right-0`, `z-30`
- Same glass treatment as sidebar
- Left: search input (rounded-full, borderless at rest, ring on focus)
- Right: notifications icon + user avatar (circle, 32px)
- On mobile (sidebar hidden): add hamburger button on left

**GlassCard spec:**
- A `<div>` wrapper with:
  - `bg-[var(--color-glass-bg)] backdrop-blur-[16px] border border-[var(--color-glass-border)]`
  - `rounded-2xl`
  - `transition-all duration-300`
  - Hover: `translateY(-2px)` + brighter border
- Accepts `className` prop for additional styles
- Accepts `hover` boolean prop (default true) for enabling hover lift

**StatusBadge spec:**
- Tiny pill: `px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider`
- Colors from CSS vars: published = green, draft = amber, archived = gray
- Accepts `status: 'draft' | 'published' | 'archived'` prop

**ThemeToggle spec:**
- Uses `useTheme` from next-themes
- Shows sun icon when dark, moon icon when light
- `'use client'` directive
- On click: toggles between 'light' and 'dark'
- Smooth icon swap with opacity transition

**Tests:** No unit tests. Verify sidebar renders in both modes, active nav item highlights
correctly, theme toggle switches classes on `<html>`.

---

## Task 3 — Login Page Redesign

**What:** Redesign `/login` to match the new Glacier/INTI aesthetic. Keep existing auth
actions (login server action) unchanged — only the UI changes.

**Why:** Login is the entry point to the dashboard. It must feel consistent with the rest
of the publisher tool.

**Files to modify:**
- `src/app/(auth)/login/page.tsx` — full UI redesign
- `src/app/(auth)/layout.tsx` — add decorative background for auth pages

**Login page spec:**
- Full screen, vertically + horizontally centered
- Background: canvas color + two decorative blurred orbs (fixed, pointer-events-none):
  - Top-left: `w-[40%] h-[40%]` circle, `bg-[var(--color-accent)]/8`, `blur-[120px]`
  - Bottom-right: smaller orb, `bg-[var(--color-secondary-accent)]/5`, `blur-[100px]`
- Center card: GlassCard, `w-full max-w-[440px]`, `p-10`
- Card contents (top to bottom):
  1. "BULLETIN" wordmark — Geist 700, small, uppercase, tracking-widest, accent color
  2. "INTI International University" — muted, xs
  3. Divider line
  4. Heading: "Sign in" — Geist 600, `text-xl`, text-primary
  5. Subtext: "Publisher access for INTI organizations" — sm, text-secondary
  6. Email input — label above, full-width, `rounded-xl`, focus ring accent color
  7. Password input — same style
  8. "Sign in" button — full-width, solid accent bg, white text, `rounded-xl`, `py-3`
     loading state: spinner + "Signing in..." disabled
  9. Error state: red text below password field if auth fails
- No signup link, no forgot password

**Animations:**
- Card entrance: `opacity-0 translateY(8px)` → `opacity-1 translateY(0)`, 400ms ease-out-quart,
  on mount (CSS @starting-style or a simple useEffect class swap)

**Tests:** Existing login action tests (if any) should still pass. Verify form submits to
existing server action. Verify error state renders.

---

## Task 4 — Dashboard Home Page

**What:** Build the dashboard home (`/dashboard`) — the first page publishers see after login.
Shows a greeting, stats, and recent announcements list.

**Why:** Orientation page. Publishers need to quickly assess the state of their content.

**Files to modify:**
- `src/app/(dashboard)/dashboard/page.tsx` — full rebuild

**Page spec:**

Page-level layout: `max-w-5xl mx-auto px-6 py-8`

**Greeting section** (top):
- Dynamic: "Good morning/afternoon/evening, [display_name]" — Geist 700, `text-3xl`, text-primary
- Subtext: "Manage INTI's announcements from here." — text-secondary

**Stats strip** (3 inline stat items, separated by vertical dividers, NOT cards):
- Published this month | In Draft | Total all-time
- Numbers: Geist Mono, `text-3xl font-bold`, accent color
- Labels: `text-xs uppercase tracking-widest`, text-muted
- Dividers: 1px vertical line, border color
- Query: count announcements by status for this publisher's organization

**Recent announcements** (last 5):
- Section heading: "Recent" — Geist 600, text-lg
- Right: "View all →" text link to `/dashboard/announcements`
- 5 AnnouncementRow components (see Task 5 for spec)
- Stagger entry animation: rows stagger in with 50ms delays

**FAB** (floating action button):
- Fixed `bottom-8 right-8`, `z-50`
- Circle, `w-14 h-14`, accent bg color
- `+` icon (Lucide Plus or Material add), white
- On hover: icon rotates 90deg (300ms), tooltip "New Announcement" slides in from right
- On click: navigate to `/dashboard/announcements/new`
- `active:scale-95 transition-all`

**Data fetching:** Server component. Query Supabase for:
1. User profile (display_name, role, organization_id)
2. Count announcements by status WHERE organization_id matches
3. Last 5 announcements with category join, ordered by updated_at DESC

**Empty state** (if no announcements): Centered SVG geometric illustration placeholder
(simple SVG shapes — no external image), heading "Nothing published yet",
"Create your first announcement" CTA linking to /dashboard/announcements/new

**Tests:** No unit tests. Verify counts render correctly, empty state shows when no data.

---

## Task 5 — Announcements List Page

**What:** Build the full announcements management page at `/dashboard/announcements`.
Includes tab navigation, search, list of rows, and pagination.

**Why:** This is the most-used page. Publishers spend most time here managing their content.

**Files to create:**
- `src/components/dashboard/AnnouncementRow.tsx` — single announcement row
- `src/app/(dashboard)/announcements/page.tsx` — list page (note: may need to adjust
  route if it doesn't exist yet; the existing route is `/dashboard/dashboard`, check
  if announcements sub-route needs creating)

**AnnouncementRow spec:**
- GlassCard used as wrapper
- Layout: `flex items-center gap-5 p-5`
- Left: thumbnail `64x64` rounded-xl, overflow-hidden, border. If no banner_url: placeholder
  div with icon in center
- Middle (flex-1):
  - Top: StatusBadge + title (Geist 600, text-lg, truncated)
  - Bottom: category dot + category name + org name — text-secondary, xs
- Right: date (Geist Mono, sm) + "Published by [author]" or "Draft" — text-muted, xs
- Far right: edit icon button + overflow menu button (more_vert / MoreVertical)
- Draft rows: `opacity-70`, dashed border variant on GlassCard
- Hover: GlassCard lift animation
- On click (row): navigate to edit page

**Announcements list page spec:**

Page header:
- Title: "Announcements" — Geist 700, `text-4xl`, tight tracking
- Subtext: "Manage your organization's updates."
- Top-right: "New Announcement" button (solid accent, rounded-full, + icon)

Stats mini-bento (4 items in a grid):
- Total Published | Pending Drafts | Scheduled (has expires_at) | Archived
- Each: GlassCard, `p-5`, label + large number

Tab strip:
- Tabs: All · Published · Drafts · Archived
- Active tab: accent color text, animated underline indicator (slides on change, 200ms)
- `'use client'` for tab state

Search input:
- Inline, full-width up to `max-w-md`, no card container
- Bottom-border-only at rest, full ring on focus
- Filters displayed rows client-side

Announcement rows:
- Filtered by active tab + search query
- Entry animation: stagger 50ms between rows on tab change or initial load
- Empty state per tab

Pagination:
- "Showing X to Y of Z results"
- Page number buttons — GlassCard style
- Active page: accent bg

**Data fetching:** Server component for initial data. Client component wrapper for
tab state and search filtering. Fetch all announcements for user's org with
category join, ordered by updated_at DESC.

**Tests:** Verify tab filtering works, search narrows results, empty states render per tab.

---

## Task 6 — Create & Edit Announcement Forms

**What:** Build the create (`/dashboard/announcements/new`) and edit
(`/dashboard/announcements/[id]/edit`) pages. Same form component, different initial state.

**Why:** Core publisher workflow. Must feel focused, distraction-free, and functional.

**Files to create:**
- `src/components/dashboard/AnnouncementForm.tsx` — shared form component (`'use client'`)
- `src/components/dashboard/ActionBar.tsx` — sticky bottom action bar
- `src/components/dashboard/AutosaveIndicator.tsx` — "Saving..." / "Saved" indicator
- `src/app/(dashboard)/announcements/new/page.tsx` — create page
- `src/app/(dashboard)/announcements/[id]/edit/page.tsx` — edit page
- `src/app/(dashboard)/announcements/new/actions.ts` — server actions for create/publish
- `src/app/(dashboard)/announcements/[id]/edit/actions.ts` — server actions for update/publish/unpublish/delete

**AnnouncementForm spec:**

Full-screen focus mode: sidebar hidden on these pages (or collapsed). Back arrow top-left.
Max-width `720px`, centered, `px-6 py-8`.

Fields:
1. **Title** — large input (`text-xl`), no visible border at rest (only `border-b`), focus:
   border-b turns accent color. Placeholder: "Announcement title". Right-aligned char count
   in Geist Mono xs (0/120).
2. **Body** — auto-grow textarea, `text-base leading-relaxed`, same borderless style.
   Min 6 rows. Placeholder: "Write the announcement body..."
3. **Category** — custom select: dropdown of categories with colored dot. Options animate in
   on open with 150ms stagger. Green focus ring.
4. **Banner Image** — upload zone: dashed border at rest, solid accent border on drag-over,
   green tint on drag-over. After upload: thumbnail preview `w-full h-48 object-cover rounded-xl`
   + "Remove" text link. Uploads to Supabase Storage bucket `announcement-banners`.
5. **Registration Link** — optional text input, label "Registration link (optional)".
   Validates URL format on blur — red border + helper text if invalid.
6. **Expires at** — optional date input, label "Expiry date (optional)".

**ActionBar spec:**
- Sticky `bottom-0`, full-width of content area
- `bg-[var(--color-surface)]/95 backdrop-blur-sm border-t border-[var(--color-border)]`
- `py-3 px-6 flex items-center justify-between`
- Left: AutosaveIndicator + current status badge
- Right: "Save Draft" ghost button + "Publish" solid accent button
- If editing published: "Save Changes" solid + "Unpublish" ghost destructive
- Button active states: `scale-[0.98]`

**AutosaveIndicator spec:**
- `'use client'`
- States: idle (nothing shown) → saving ("Saving..." with spinner, Geist Mono xs) →
  saved ("Saved ✓" with checkmark, fades out after 2s) → error ("Save failed")
- Triggers: form dirty + 30s elapsed OR explicit save button click

**Server actions:**
- `createAnnouncement(formData)` — inserts announcement as draft, returns id for redirect
- `updateAnnouncement(id, formData)` — updates fields, returns updated record
- `publishAnnouncement(id)` — sets status='published', published_at=now()
- `unpublishAnnouncement(id)` — sets status='draft', clears published_at
- `deleteAnnouncement(id)` — deletes record, redirects to list

All server actions use `createClient()` from Supabase server client, verify user owns
the announcement's organization before mutating.

**Banner upload flow:**
- Client-side: upload file to Supabase Storage via `supabase.storage.from('announcement-banners').upload()`
- Get public URL after upload
- Store URL in form state
- On save: include banner_url in the announcement upsert

**Tests:**
- Verify create form submits and creates a draft record
- Verify edit form pre-fills fields correctly
- Verify publish action sets status and published_at
- Verify URL validation rejects invalid links

---

## Task 7 — Animations & Polish Pass

**What:** Add all the specified animations, micro-interactions, and polish across all dashboard
pages. Also ensure responsive behavior works on mobile.

**Why:** Animations and polish are what make the Glacier aesthetic feel right. Without them
it's just a static layout.

**What to implement:**

**Entry animations (apply to all dashboard pages):**
- Page content: initial `opacity-0 translate-y-[-4px]`, animate to natural on mount,
  200ms `cubic-bezier(0.25, 1, 0.5, 1)`
- Row lists: each row gets `animation-delay: calc(var(--row-index) * 50ms)`,
  `opacity-0 translate-y-[6px]` → natural, 250ms ease-out
- Stat strip numbers: count-up animation from 0 to final value on first render

**Micro-interactions:**
- All buttons: `active:scale-[0.98]` (already in Tailwind, verify it's applied)
- FAB: hover rotates `+` icon 90deg, tooltip slides in
- Tab underline: CSS `transition: transform 200ms cubic-bezier(0.25, 1, 0.5, 1)`, needs
  JS to measure tab positions and move the underline element
- Overflow menu: `transform-origin: top-right`, enter with `scale(0.95) opacity-0` →
  `scale(1) opacity-1`, 150ms ease-out
- Form inputs: border-b color transition on focus, 200ms
- Upload zone: border style + bg color transition on drag-over, 200ms
- Autosave checkmark: SVG path draw animation (`stroke-dasharray` + `stroke-dashoffset`)

**Responsive:**
- Mobile (`<768px`): sidebar collapses to bottom drawer (hamburger in topnav triggers it)
- Tablet (`768–1023px`): sidebar collapses to icon-only (48px wide), tooltip on hover reveals label
- Desktop (`1024px+`): full sidebar

**prefers-reduced-motion:**
- Add `@media (prefers-reduced-motion: reduce)` block that sets all transitions to 0ms

**Polish checklist:**
- All interactive elements have visible focus rings (accent color outline)
- All text meets WCAG AA contrast in both modes
- Touch targets 44px minimum
- No layout shift on theme switch
- Geist Mono used for all numbers (counts, dates)
- Tab order is logical across all forms

**Tests:** No unit tests. Manual verification across both modes, mobile viewport, and
with prefers-reduced-motion enabled.

---

## Implementation Order

Tasks should be executed in sequence (each depends on the previous):
1. Foundation (fonts, theme, CSS tokens)
2. Shared components
3. Login page
4. Dashboard home
5. Announcements list
6. Create/edit forms
7. Animations & polish

---

## Key Constraints

- Do not modify `src/app/(public)/*` files except Header and AnnouncementCard color updates in Task 1
- Do not modify `src/lib/database.types.ts` — auto-generated, do not edit
- Use existing `createClient()` from `@/lib/supabase/server` for all server-side Supabase access
- All new components that use React hooks or browser APIs must have `'use client'` directive
- Tailwind v4 — no `tailwind.config.ts` needed; configure via `@theme inline` in globals.css
- Do not add any other font libraries — only Geist from next/font/google
