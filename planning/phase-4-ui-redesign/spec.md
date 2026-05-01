# Bulletin — Phase 4: UI Redesign & Feature Completion

## Project Context

Bulletin is a real production announcement platform for INTI International University (Malaysia).
It replaces fragmented communication across WhatsApp, Instagram, email, and noticeboards with a
single trusted source of campus announcements.

Stack: Next.js 16.2.3 (App Router, TypeScript, Turbopack), Tailwind v4, Supabase (Auth + DB + Storage), Vercel.
Project path: C:/Users/cusma/projects/Bulletin
Branch: feature/phase-3-dashboard

### Current State (what is already built)

- Phase 2 COMPLETE: Public feed at `/`, announcement detail at `/announcements/[id]`, category filter, Header nav
- Phase 3 Tasks 1–5 COMPLETE: Dashboard foundation, shared components (GlassCard, StatusBadge, ThemeToggle, DashboardSidebar), login page, dashboard home, announcements list page
- Phase 3 Tasks 6–7 NOT STARTED: Create/Edit forms, animations & polish
- DB schema is complete — `announcements` table already has: `banner_url` (optional image), `registration_link` (optional external URL), `body` (markdown/rich text), `title`, `category_id`, `organization_id`, `status`, `published_at`, `expires_at`

### Design Reference

A reference UI prototype (`bulletin.jsx`) was reviewed. Key design decisions adopted from it:
- Warm neutral color palette (not cold white)
- Playfair Display serif for display headings + DM Sans for body text
- INTI brand primary red (#C8102E), gold (#D4941F), navy (#002147)
- Announcement cards with left category-colored stripe, category pill, priority badge
- Publisher form with 2-column layout (form + live preview sidebar)
- Sticky nav with backdrop blur, role-based links, theme toggle

---

## What This Phase Builds

This plan covers ALL remaining work to ship a production-ready Bulletin:

1. **Design system alignment** — typography, INTI warm color tokens, logo placeholder
2. **Public feed redesign** — new card design, hero, category pills, warm palette
3. **Announcement detail page** — markdown rendering, image, registration CTA
4. **Dashboard Task 6** — Create & Edit announcement forms
5. **Dashboard Task 7** — Animations, polish, mobile responsive
6. **Mobile** — all pages fully responsive

---

## Design System

### INTI Brand Colors

Primary red: `#C8102E`
Gold: `#D4941F`
Navy: `#002147`

### Light Mode Token Set

```
bg:           #FAF9F7   (warm off-white — not cold #FAFAFA)
surface:      #FFFFFF
surface-alt:  #F4F1EC   (warm cream for inputs, muted areas)
border:       #E8E2D9
text:         #1A1614   (warm near-black)
text-muted:   #7A6F6A
accent:       #C8102E   (INTI primary red)
accent-gold:  #D4941F
navy:         #002147
```

### Dark Mode Token Set

```
bg:           #0F0E0D
surface:      #1C1917
surface-alt:  #252220
border:       #2E2925
text:         #F5F0EB
text-muted:   #9C9189
accent:       #E8203A
accent-gold:  #F5A623
navy:         #3A6BAD
```

### Typography

Display headings: Playfair Display (Google Fonts, weights 600 700) — serif, editorial
Body / UI text: DM Sans (Google Fonts, weights 300 400 500 600) — clean, modern

Both fonts loaded via `next/font/google` in `layout.tsx`. CSS variables: `--font-display`, `--font-sans`.
Replace current Geist references with these.

### Logo

The Bulletin project does not yet have a final logo. Use a placeholder throughout:
- A 32×32 (nav) / 52×52 (login) rounded rectangle with a red-to-gold gradient background
  (`linear-gradient(135deg, #C8102E 60%, #D4941F 100%)`)
- Inside: the letter "B" in white, Playfair Display Bold
- Label next to it: "Bulletin" in Playfair Display Bold + "INTI" in small muted text
- When the real logo is ready it will be dropped in as an `<Image>` component — leave a
  clear `TODO: replace with real logo` comment at that spot

### Category Colors

The categories table already has a `color` hex column. Seed values:
- Academic: `#C8102E` (INTI red)
- Events: `#002147` (INTI navy)
- Sports: `#4A9B7F`
- Student Life: `#D4941F` (gold)
- Opportunities: `#7B5EA7`
- General: `#6B7280`

These colors are used for category pills and the left-edge stripe on announcement cards.

---

## Section 1 — Design System: Fonts, Tokens, Logo

### Files to modify
- `src/app/layout.tsx` — replace Geist with Playfair Display + DM Sans via next/font/google
- `src/app/globals.css` — update all CSS custom properties to the warm INTI token set above
- `src/components/layout/Header.tsx` — add logo placeholder, update colors to use CSS tokens
- `src/components/dashboard/DashboardSidebar.tsx` — add logo placeholder, update colors

### Font setup

In `layout.tsx`, import from `next/font/google`:
```
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' })
const dmSans   = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-sans' })
```

Apply both variables to the `<html>` element classname.

### Logo placeholder component

Create `src/components/ui/BulletinLogo.tsx` — a small component that renders the gradient B mark
plus wordmark. Accepts a `size` prop: `'sm'` (32px, for nav) and `'lg'` (52px, for login card).

### globals.css updates

Replace all existing CSS custom properties with the new token set. Also update Tailwind v4 `@theme inline`
block to map tokens to utility classes. Keep the existing `fade-up` and `slide-in` keyframes. Add:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Section 2 — Public Feed Redesign

### Goal

Redesign the public feed (`/`) to match the editorial + INTI warm aesthetic from the bulletin.jsx
reference. No layout structure changes (still server component, still grid). Only visual layer changes.

### Files to modify
- `src/app/(public)/page.tsx` — update hero section, background, typography
- `src/components/announcements/AnnouncementCard.tsx` — full redesign
- `src/components/announcements/CategoryFilter.tsx` — redesign pills

### Public feed page (`page.tsx`) changes

Hero section:
- Background: warm `var(--color-bg)` (not cold `#FAFAFA`)
- Add a 6px wide INTI red vertical bar left of a small "INTI International University" uppercase label
- Page title: "Campus Bulletin" in Playfair Display Bold, `clamp(2.5rem, 5vw, 3.5rem)`, warm near-black
- Subtext: "All official announcements from INTI in one place." in DM Sans text-muted
- Remove the double-rule newspaper divider — replace with a single 1px warm border-color line
- Add a stats bar below the hero (inline, not cards): shows count of Active / Urgent / Events
  fetched server-side. Numbers in Playfair Display, labels in DM Sans xs uppercase

Grid layout: keep `grid gap-px` but change `bg-[#E4E4E7]` gap color to `var(--color-border)`.

### AnnouncementCard redesign

New card anatomy (inspired by bulletin.jsx):
- Outer wrapper: white surface, `border border-[var(--color-border)]`, `rounded-2xl`, `overflow-hidden`
- Left edge stripe: `4px wide`, full height, colored by `categories.color`. If no category: `var(--color-accent)`.
  This is the primary priority/category visual cue.
- Optional banner image: render `<Image>` at `h-44 object-cover` IF `banner_url` is not null. If null:
  do not render the image section at all — no placeholder, no empty box. Purely conditional.
- Top pills row: category pill (colored dot + name, background = category color + 18 opacity) +
  priority badge if announcement is urgent (to be determined by publisher). For now derive priority
  from whether `expires_at` is within 7 days: if yes show "Urgent" pill in red.
- Title: Playfair Display 600, `text-[17px]`, warm near-black, max 2 lines
- Body excerpt: DM Sans `text-[13.5px]`, text-muted, `line-clamp-2`
- Footer: org name + published date | views (if tracked) + expiry hint
- Registration link hint: if `registration_link` exists, show a small "Register →" badge in INTI red
- Hover: `translateY(-3px)` lift + deeper box shadow, 220ms ease
- The entire card is wrapped in `<Link href="/announcements/[id]">` — fully clickable

### CategoryFilter redesign

Pills: `bg-[var(--color-surface-alt)] border border-[var(--color-border)]` at rest.
Active: `bg-[var(--color-accent)] text-white border-[var(--color-accent)]`.
Use DM Sans text-[13px] font-medium.

---

## Section 3 — Announcement Detail Page Redesign

### Goal

Update `/announcements/[id]/page.tsx` to:
1. Fix old green color (`#1B4332`) → use INTI tokens
2. Render `body` as markdown (not plain `whitespace-pre-wrap`)
3. Polish the layout with the warm design system
4. Make the registration CTA button INTI-branded

### Files to modify
- `src/app/(public)/announcements/[id]/page.tsx` — redesign + markdown rendering
- Install: `npm install react-markdown` (or `next-mdx-remote` if body has MDX features — use
  `react-markdown` for simplicity since body is plain markdown from the publisher form)

### Detail page layout

Max width: `max-w-2xl mx-auto px-4 py-10`

Back button: "← Back to Announcements" in DM Sans `text-[11px] tracking-[0.15em] uppercase text-muted`.
Hover: text changes to INTI red. Use INTI red focus ring (not old green).

Banner: IF `banner_url` exists: render `<Image>` at `aspect-[16/7]` with rounded corners `rounded-2xl`,
`mb-8`. IF null: skip entirely — no empty space.

Meta row: category pill (with dot + name, styled same as feed cards) + org name + published date.
All in DM Sans xs uppercase tracking.

Title: Playfair Display Bold, `clamp(2rem, 5vw, 3rem)`, warm near-black text.

Rule: single 1px warm border line below title (not double-rule).

Body: render as markdown using `<ReactMarkdown>`. The body field accepts markdown so publishers can
use **bold**, *italic*, ## headers, - lists, etc. Style the markdown output with Tailwind prose or
custom CSS:
- `h2`, `h3` in Playfair Display 600, warm near-black
- Paragraphs in DM Sans `text-[15px] leading-[1.85]` text-body color
- Lists: DM Sans, with modest indent
- Bold/italic: natural weight/style, no special color

Registration CTA: IF `registration_link` exists, render below the body:
- A prominent button: INTI red background, white text, DM Sans 600, `text-[13px] tracking-wide uppercase`
- Text: "Register Now →"
- `target="_blank" rel="noopener noreferrer"` — opens external form in new tab
- Full WCAG focus ring in INTI red

Expiry note: if `expires_at` is set, show a muted "This announcement expires on [date]" info bar below
the CTA. Use `bg-[var(--color-surface-alt)]` + border, same as bulletin.jsx expiry block.

---

## Section 4 — Dashboard Task 6: Create & Edit Forms

### Goal

Build the announcement authoring workflow:
- `/dashboard/announcements/new` — create page
- `/dashboard/announcements/[id]/edit` — edit page
- Shared `<AnnouncementForm>` component
- Sticky `<ActionBar>` with autosave
- `<AutosaveIndicator>` component
- Server actions for CRUD + publish/unpublish

Design inspiration from bulletin.jsx `PublisherPage`:
- 2-column layout on desktop: form (left, wider) + live preview sidebar (right, 340px)
- Live preview renders the actual `AnnouncementCard` component with form data
- AI Draft button in body field (calls Anthropic API — publisher only feature)
- All form fields in DM Sans, labels in text-muted
- Category select: custom dropdown with colored dot per option

### Files to create
- `src/components/dashboard/AnnouncementForm.tsx` — shared form (`'use client'`)
- `src/components/dashboard/ActionBar.tsx` — sticky bottom bar
- `src/components/dashboard/AutosaveIndicator.tsx`
- `src/app/(dashboard)/announcements/new/page.tsx`
- `src/app/(dashboard)/announcements/new/actions.ts`
- `src/app/(dashboard)/announcements/[id]/edit/page.tsx`
- `src/app/(dashboard)/announcements/[id]/edit/actions.ts`

### AnnouncementForm fields

1. **Title** — large DM Sans input, `text-xl`, bottom-border-only at rest (border-b), accent color
   on focus. Right-aligned char count `0/120` in DM Sans Mono xs.
2. **Body** — auto-grow textarea with minimum 6 rows, same borderless style. Markdown supported —
   publishers can write `## Header`, `**bold**`, `- list`. Right: "✦ AI Draft" button (calls
   Anthropic API to generate a professional body based on the title, category, and org).
3. **Category** — custom select with colored dot per option. Options: all active categories from DB.
4. **Banner image** — upload zone: dashed border, solid accent on drag-over. After upload: thumbnail
   preview `w-full h-48 object-cover rounded-2xl` + "Remove" link. Uploads to Supabase Storage
   bucket `announcement-banners`. `banner_url` stored in DB. Fully optional — if not uploaded,
   `banner_url` remains null and the public card will not show an image section.
5. **Registration link** — optional text input. Label: "Registration link (optional)" — e.g. a
   Google Form URL, Eventbrite link, etc. Validates URL format on blur.
6. **Expiry date** — optional date picker. Label: "Expiry date (optional)".

### ActionBar

Sticky `bottom-0`, full content-width, backdrop-blur.
Left: `<AutosaveIndicator>` + current status badge.
Right:
- If creating (status = draft): "Save Draft" ghost + "Publish" solid INTI red
- If editing draft: "Save Draft" ghost + "Publish" solid INTI red
- If editing published: "Save Changes" solid + "Unpublish" ghost destructive

### AutosaveIndicator

States: idle → saving (spinner + "Saving…") → saved ("Saved ✓", fades after 2s) → error ("Save failed").
Uses DM Sans Mono xs.

### Server actions

- `createAnnouncement(formData)` → insert as draft, redirect to edit page
- `updateAnnouncement(id, formData)` → update fields
- `publishAnnouncement(id)` → set `status='published'`, `published_at=now()`
- `unpublishAnnouncement(id)` → set `status='draft'`, clear `published_at`
- `deleteAnnouncement(id)` → delete + redirect to list

All actions verify the user's `organization_id` matches the announcement's before mutating.

### Live preview sidebar

On desktop, right column shows a `<AnnouncementCard>` preview that updates as the publisher types.
Title, body excerpt, category, banner preview, and registration link hint all reflect form state
in real time. Uses the same `AnnouncementCard` component from the public feed — no separate preview component.

On mobile, the preview collapses and is replaced by a "Preview" toggle tab.

### AI Draft button

Small button in the body field label row: "✦ AI Draft".
On click: calls the Anthropic API (Claude claude-sonnet-4-6) with a system prompt:
"Write a concise, professional university announcement body (max 100 words) for INTI International
University. Return only the body text."
User message: `"Title: [title] — Category: [category] — Organization: [org]"`
On success: populates the body textarea.
On error: show small error text below the button.
The API call is client-side (publisher portal feature only). API key must be in env as
`NEXT_PUBLIC_ANTHROPIC_KEY` — document this requirement clearly in the component.

---

## Section 5 — Dashboard Task 7: Animations, Polish & Mobile

### Goal

Add all animations and micro-interactions across the dashboard. Ensure mobile works correctly.

### Entry animations (apply to all pages)

- Page content: `opacity-0 translateY(-4px)` → natural on mount, 200ms cubic-bezier(0.25, 1, 0.5, 1)
- List rows: stagger 50ms per row using `animation-delay: calc(var(--row-index) * 50ms)`
- Stat numbers: count-up from 0 → final value on first render

### Micro-interactions

- All buttons: `active:scale-[0.98]`
- Announcement cards (public): hover `translateY(-3px)` + deeper shadow
- FAB (dashboard home): hover rotates + icon 90deg, tooltip slides in
- Tab underline: CSS `transform` slides indicator, 200ms ease
- Form inputs: border-b color transitions to accent on focus, 200ms
- Upload zone: border style + tint transition on drag-over
- Autosave checkmark: SVG stroke-draw animation
- Theme toggle: smooth icon swap

### Mobile responsive

- Public feed: single column on mobile (`< 640px`), 2-col on tablet, 3-col on desktop
- Announcement detail: full width, comfortable padding, readable body text
- Dashboard sidebar: collapses to drawer on mobile (`< 768px`). Hamburger in DashboardTopNav.
- Dashboard sidebar: icon-only on tablet (768–1023px), hover tooltip for labels
- Publisher form: stacked single-column on mobile, 2-col on desktop (form + preview)
- Preview sidebar hidden on mobile, replaced by a "Preview" tab toggle

### Accessibility

- All interactive elements: visible focus ring in INTI red
- Minimum 44px touch targets
- `prefers-reduced-motion`: `@media (prefers-reduced-motion: reduce)` sets all transitions to `0ms`
- WCAG AA contrast in both light and dark modes
- Logical tab order on all forms

---

## Key Constraints

- Do NOT modify `src/lib/database.types.ts` (auto-generated by Supabase)
- No new DB migrations needed — all required columns already exist
- All new client components must have `'use client'` directive
- Tailwind v4 — configure via `@theme inline` in globals.css only
- All Supabase server calls use `createClient()` from `@/lib/supabase/server`
- `react-markdown` for rendering body content (lightweight, no MDX needed)
- No hardcoded announcement data anywhere — all content from Supabase

---

## Implementation Order

1. Design system (fonts, tokens, logo placeholder)
2. Public feed redesign (AnnouncementCard + page hero)
3. Announcement detail redesign (markdown render, INTI colors, registration CTA)
4. Dashboard Create/Edit forms (Task 6)
5. Animations & polish + mobile (Task 7)
