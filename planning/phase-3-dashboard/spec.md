# Bulletin Phase 3 — Publisher Dashboard Spec

## Project Context

Bulletin is the official announcement platform for INTI International University (newinti.edu.my).
Publishers (club officers, dept staff, faculty) log in to create, manage, and publish announcements
to the public feed at bulletin-l2ai.vercel.app.

The public feed (Phase 2) is already live with an editorial newspaper aesthetic.
The dashboard is a separate product surface — a modern workspace.

## Stack

- **Framework:** Next.js 15, App Router, TypeScript
- **Styling:** Tailwind CSS v4
- **UI:** shadcn/ui (New York style)
- **Auth/DB:** Supabase
- **Font:** Geist + Geist Mono (via next/font/google)
- **Theme:** next-themes (system auto + manual toggle)

## Design System

### Typography
- Display/headings: Geist 600–700, tracking -0.02em
- Body/UI: Geist 400–500
- Metadata/numbers: Geist Mono 400, tabular-nums

### Light Mode — INTI Red
```
Canvas bg:         #FFF7F7
Surface:           #FFFFFF
Surface elevated:  #FFF0F0
Border default:    #F5C6C6
Border subtle:     #FAE0E0
Text primary:      #1A0505
Text secondary:    #7A2828
Text muted:        #A07070
Accent primary:    #EC2028   (INTI red)
Accent hover:      #C41920
Accent surface:    #FEE8E8
Secondary accent:  #F78B53   (INTI orange)
Glass card bg:     rgba(255,255,255,0.75) + backdrop-blur-16
Glass border:      rgba(236, 32, 40, 0.12)
Status Published:  #15803D on #DCFCE7
Status Draft:      #92400E on #FEF3C7
Status Archived:   #525252 on #F3F4F6
Destructive:       #B91C1C
```

### Dark Mode — Glacier + INTI Red
```
Background:        #0A0E1A
Surface:           #0F1524
Surface container: #141C2E
Surface high:      #1A2438
Border default:    rgba(236, 32, 40, 0.12)
Border hover:      rgba(236, 32, 40, 0.28)
Text primary:      #F0E8E8
Text secondary:    #C4A4A4
Text muted:        #8B6B6B
Accent primary:    #FF5A5F   (INTI red brightened for dark bg)
Accent hover:      #FF7A7E
Accent surface:    rgba(255, 90, 95, 0.10)
Tertiary:          #F78B53   (INTI orange)
Glass card bg:     rgba(15, 21, 36, 0.60) + backdrop-blur-16
Glass border:      rgba(255, 90, 95, 0.10)
Decorative orb:    rgba(236, 32, 40, 0.08) blur-[120px]
Status Published:  #4ADE80 on rgba(74,222,128,0.10)
Status Draft:      #F78B53 on rgba(247,139,83,0.10)
Status Archived:   #64748B on rgba(100,116,139,0.10)
Destructive:       #FF6B6B
```

### Visual Style Reference
The Glacier OS HTML mockup (provided by developer) defines the component feel:
- Glass cards: `backdrop-filter: blur(16px)` + semi-transparent bg + subtle border
- Hover: lift (`translateY(-2px)`) + border brightens + inset glow
- Rounded corners: `rounded-2xl` for cards, `rounded-xl` for buttons/inputs
- Dark bg decorative orbs: fixed, pointer-events-none, blur-[120px]
- Sidebar: fixed left, 256px wide, glass background
- Top nav: fixed top, glass background, search + user avatar
- FAB: fixed bottom-right, primary accent, rotates icon on hover

## Database Schema (existing)

```
announcements: id, title, body, banner_url, status (post_status enum),
               category_id, organization_id, author_id, registration_link,
               published_at, expires_at, archived_at, created_at, updated_at

categories: id, name, slug, color, is_active
organizations: id, name, slug, logo_url
users: id, display_name, role (user_role enum), email
```

Status enum values: draft, published, archived (assumed from context)

## Pages in Scope

1. Login (`/login`) — redesign for new aesthetic
2. Dashboard Home (`/dashboard`) — greeting, stats, recent list
3. Announcements List (`/dashboard/announcements`) — tabs, search, rows
4. Create Announcement (`/dashboard/announcements/new`)
5. Edit Announcement (`/dashboard/announcements/[id]/edit`)

## Shared Components

- `DashboardSidebar` — fixed left nav with Bulletin branding, nav links, theme toggle, user info, logout
- `DashboardTopNav` — search bar, notifications icon, user avatar
- `DashboardShell` — layout wrapper (sidebar + topnav + children)
- `GlassCard` — theme-aware glass morphism card
- `StatusBadge` — pill badge for post status
- `AnnouncementRow` — single row in the announcements list
- `ThemeToggle` — sun/moon button for sidebar
- `FAB` — floating action button

## Existing Files to Update

- `src/app/layout.tsx` — add Geist font, remove Newsreader/Roboto from dashboard routes
- `src/app/globals.css` — add INTI red + Glacier dark color tokens
- `src/components/layout/Header.tsx` — replace #1B4332 with #EC2028
- `src/components/announcements/AnnouncementCard.tsx` — replace #1B4332 with #EC2028
- `src/app/(auth)/login/page.tsx` — redesign UI
- `src/app/(dashboard)/layout.tsx` — add DashboardShell
- `src/app/(dashboard)/dashboard/page.tsx` — build out home page

## Animations

- Page route entry: fade + translateY(-4px) → translateY(0), 200ms ease-out-quart
- Row load stagger: 50ms delay between rows, translateY(6px) → 0 + opacity 0 → 1
- Tab underline: translateX slide, 200ms ease-out
- Glass card hover: translateY(-2px) + border brighten, 200ms
- Button active: scale(0.98), 150ms
- FAB icon: rotate-90 on hover, 300ms
- Overflow menu open: scale(0.95)+opacity0 → scale(1)+opacity1, 150ms ease-out
- Autosave indicator: fade in "Saving..." → checkmark draw → fade out after 2s
- Decorative orbs: static (no animation needed)
- Always: prefers-reduced-motion → instant transitions

## Accessibility

- WCAG AA contrast on all text
- Focus rings visible in both modes (red accent ring)
- Touch targets 44px min
- Keyboard navigable sidebar and forms
- prefers-reduced-motion respected

## Out of Scope for Phase 3

- Admin panel (`(admin)` route group)
- Email notifications
- Rich text editor (plain textarea is fine)
- Real-time autosave via websockets (setTimeout polling is fine)
