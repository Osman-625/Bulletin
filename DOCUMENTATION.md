# Bulletin — Full Project Documentation

> **Version:** main branch · **Date:** 2026-05-09 · **Author:** Osman (Maaney)
> **Stack:** Next.js 16 · Supabase · Tailwind CSS v4 · Vercel

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project File Tree](#3-project-file-tree)
4. [Database Schema](#4-database-schema)
5. [Role & Permission System](#5-role--permission-system)
6. [Authentication Flows](#6-authentication-flows)
7. [Public Interface](#7-public-interface)
8. [Publisher Dashboard](#8-publisher-dashboard)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Super Admin Dashboard](#10-super-admin-dashboard)
11. [Owner Dashboard](#11-owner-dashboard)
12. [Core Library Architecture](#12-core-library-architecture)
13. [Security Architecture](#13-security-architecture)
14. [Notifications System](#14-notifications-system)
15. [Audit Log](#15-audit-log)
16. [API Routes](#16-api-routes)
17. [Migration History](#17-migration-history)
18. [Design System & Theming](#18-design-system--theming)
19. [Testing](#19-testing)
20. [Deployment](#20-deployment)

---

## 1. Project Overview

**Bulletin** is the official campus announcement management system for **INTI International University**. It provides a role-gated editorial pipeline from announcement creation through admin review to public publication.

### What it does

| Feature                           | Description                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| **Public feed**                   | Unauthenticated browsing of published announcements with category filters and search     |
| **Publisher workspace**           | Draft, submit, and track announcements with autosave and live preview                    |
| **Review pipeline**               | Admins approve or reject submitted announcements with inline comments                    |
| **Scheduled publishing**          | Announcements can be published immediately or set to go live at a future date            |
| **Pinned posts**                  | Featured/urgent announcements pinned until a specific date                               |
| **Multi-org**                     | Users can belong to multiple organizations; admins are org-scoped                        |
| **In-app notifications**          | Publishers receive notifications on submission outcome (approved/rejected)               |
| **View tracking**                 | Anonymous view counts per published announcement via secure RPC                          |
| **Audit trail**                   | Every privileged action is logged with actor, target, and metadata                       |
| **Password reset workflow**       | Publisher requests reset → super admin issues temp password → force-change on next login |
| **Invitation-based registration** | New publishers join via 7-day token links sent by admins                                 |
| **Dark/light theme**              | CSS variable-based design tokens, togglable per session                                  |

---

## 2. Tech Stack

```
Frontend
├── Next.js 16.2.3          — App Router, Server Components, Server Actions
├── React 19.2.4            — Concurrent, no client state library needed
├── Tailwind CSS v4         — CSS-first config, @theme inline tokens
├── tw-animate-css          — Animation utilities
├── shadcn/ui               — Headless primitives (minimal usage)
├── lucide-react 1.8.0      — Icon set
├── react-markdown 10.1.0   — Announcement body rendering
└── next-themes 0.4.6       — Dark/light theme toggling

Backend / Database
├── Supabase (PostgreSQL)   — Database, Auth, Storage, RLS
├── @supabase/ssr           — SSR-safe client creation (cookies)
├── @supabase/supabase-js   — Supabase SDK

Typography
├── Libre Franklin          — --font-sans (body)
├── Geist Mono              — --font-mono (stats, codes)
└── Newsreader              — --font-display (hero headings)

Testing
├── Vitest 4.1.5            — Unit tests
└── Playwright 1.59.1       — E2E tests

Tooling
├── TypeScript 5            — Strict types throughout
├── ESLint 9 + eslint-config-next
└── Prettier + prettier-plugin-tailwindcss

Deployment
└── Vercel                  — Edge deployment, env vars, preview URLs
```

---

## 3. Project File Tree

```
Bulletin/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        ← Root layout (fonts, providers)
│   │   ├── globals.css                       ← Design tokens, animations
│   │   ├── providers.tsx                     ← ThemeProvider wrapper
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (public)/                         ← No auth required
│   │   │   ├── page.tsx                      ← Public announcements feed
│   │   │   ├── layout.tsx                    ← Header + footer
│   │   │   └── announcements/
│   │   │       └── [id]/
│   │   │           ├── page.tsx              ← Single announcement detail
│   │   │           ├── ViewTracker.tsx       ← Client view counter component
│   │   │           └── actions.ts            ← Server action: increment_view
│   │   │
│   │   ├── (auth)/                           ← Unauthenticated flows
│   │   │   ├── layout.tsx                    ← Centered card layout
│   │   │   ├── login/
│   │   │   │   ├── page.tsx                  ← Sign-in form (split-panel)
│   │   │   │   └── actions.ts                ← login(), logout() server actions
│   │   │   └── forgot-password/
│   │   │       ├── page.tsx                  ← Password reset request form
│   │   │       └── actions.ts                ← requestPasswordReset()
│   │   │
│   │   ├── (dashboard)/                      ← Publisher workspace
│   │   │   ├── layout.tsx                    ← DashboardShell (sidebar + topnav)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                  ← Stats + recent announcements
│   │   │       ├── announcements/
│   │   │       │   ├── page.tsx              ← Announcements list
│   │   │       │   ├── AnnouncementsClient.tsx
│   │   │       │   ├── new/
│   │   │       │   │   ├── page.tsx          ← New announcement form
│   │   │       │   │   └── actions.ts
│   │   │       │   └── [id]/edit/
│   │   │       │       ├── page.tsx          ← Edit announcement form
│   │   │       │       └── actions.ts
│   │   │       ├── notifications/page.tsx    ← In-app notification inbox
│   │   │       └── settings/page.tsx         ← Account settings
│   │   │
│   │   ├── (admin)/                          ← Admin workspace
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx                  ← Admin overview + review queue
│   │   │       ├── review/
│   │   │       │   ├── page.tsx              ← Review queue list
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx          ← Announcement detail review
│   │   │       │       └── actions.ts        ← approveAnnouncement(), rejectAnnouncement()
│   │   │       ├── orgs/
│   │   │       │   ├── page.tsx              ← Organizations list
│   │   │       │   └── new/
│   │   │       │       ├── page.tsx          ← Create organization form
│   │   │       │       └── actions.ts
│   │   │       ├── publishers/
│   │   │       │   ├── page.tsx              ← Publishers list
│   │   │       │   └── invite/
│   │   │       │       ├── page.tsx          ← Send publisher invite
│   │   │       │       ├── actions.ts
│   │   │       │       └── CopyInviteLink.tsx
│   │   │       ├── users/page.tsx            ← User role management
│   │   │       ├── categories/page.tsx       ← Category management
│   │   │       ├── analytics/page.tsx        ← Org-scoped analytics
│   │   │       ├── notifications/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   ├── (super-admin)/                    ← Super Admin workspace
│   │   │   ├── layout.tsx
│   │   │   └── super-admin/
│   │   │       ├── page.tsx                  ← Platform overview stats
│   │   │       ├── admins/
│   │   │       │   ├── page.tsx              ← Admins list
│   │   │       │   └── invite/
│   │   │       │       ├── page.tsx
│   │   │       │       └── actions.ts
│   │   │       ├── users/
│   │   │       │   ├── page.tsx              ← All users + password reset
│   │   │       │   ├── actions.ts
│   │   │       │   ├── _ResetButton.tsx
│   │   │       │   └── PasswordResetRequestButton.tsx
│   │   │       ├── categories/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   ├── (owner)/                          ← Owner-only workspace
│   │   │   ├── layout.tsx
│   │   │   └── owner/
│   │   │       ├── page.tsx                  ← System overview
│   │   │       ├── users/page.tsx            ← Full user CRUD
│   │   │       ├── categories/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── resources/page.tsx        ← Read-only Vercel/Supabase resources + view counters
│   │   │       ├── audit/page.tsx            ← Immutable audit log viewer
│   │   │       ├── notifications/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   ├── api/
│   │   │   └── setup/route.ts               ← Bootstrap owner account (one-time)
│   │   │
│   │   ├── change-password/
│   │   │   ├── page.tsx                     ← Force-change password screen
│   │   │   └── actions.ts
│   │   │
│   │   └── register/
│   │       ├── page.tsx                     ← Invitation-based registration
│   │       └── actions.ts
│   │
│   ├── components/
│   │   ├── account/
│   │   │   └── AccountSettingsPage.tsx      ← Display name + password change
│   │   ├── announcements/
│   │   │   ├── AnnouncementCard.tsx         ← Public feed card
│   │   │   ├── BackButton.tsx
│   │   │   └── CategoryFilter.tsx           ← Category pill filter
│   │   ├── auth/
│   │   │   └── IdleLogout.tsx               ← Inactivity auto-logout
│   │   ├── dashboard/
│   │   │   ├── ActionBar.tsx                ← Save/submit/publish buttons
│   │   │   ├── AnnouncementForm.tsx         ← Full announcement editor
│   │   │   ├── AnnouncementRow.tsx          ← List row with status badge
│   │   │   ├── AutosaveIndicator.tsx        ← Saving… / Saved state
│   │   │   ├── CountUp.tsx                  ← Animated stat counter
│   │   │   ├── DashboardShell.tsx           ← Root shell (sidebar + topnav)
│   │   │   ├── DashboardSidebar.tsx         ← Role-aware nav sidebar
│   │   │   ├── DashboardTopNav.tsx          ← Mobile header + notification bell
│   │   │   ├── GlassCard.tsx                ← Reusable glassmorphic card
│   │   │   ├── NotificationsPanel.tsx       ← Slide-out notifications drawer
│   │   │   ├── StatusBadge.tsx              ← draft/submitted/published/etc.
│   │   │   ├── SubmitButton.tsx             ← Loading-aware form button
│   │   │   └── ThemeToggle.tsx              ← Dark/light toggle button
│   │   └── layout/
│   │       ├── Header.tsx                   ← Public site header
│   │       └── ThemeToggle.tsx              ← Public header theme toggle
│   │
│   └── lib/
│       ├── data.ts                          ← All DB query functions
│       ├── types.ts                         ← Domain types (Row + Relation)
│       ├── database.types.ts                ← Auto-generated Supabase types
│       ├── utils.ts                         ← cn() + misc helpers
│       ├── audit.ts                         ← logAuditEvent()
│       ├── notifications.ts                 ← notification reads/writes
│       ├── notification-actions.ts          ← markAsRead server action
│       ├── proxy.ts                         ← Edge proxy helper
│       ├── announcements/
│       │   ├── access.ts                    ← Org-scoped access resolution
│       │   ├── feed.ts                      ← Feed filtering helpers
│       │   ├── form.ts                      ← Form validation helpers
│       │   ├── presentation.ts              ← Display font/size/urgency enums
│       │   └── urls.ts                      ← URL generation helpers
│       ├── auth/
│       │   ├── authz.ts                     ← Role hierarchy, canManageUser, getCurrentAccessContext
│       │   └── sync-users.ts               ← ensureAuthUserProfile()
│       ├── owner/
│       │   └── resources.ts                ← Owner resource DTOs and external health fetches
│       ├── supabase/
│       │   ├── client.ts                    ← Browser Supabase client
│       │   ├── server.ts                    ← SSR Supabase client (cookies)
│       │   └── admin.ts                     ← Service role client
│       └── security/
│           ├── rate-limit.ts               ← In-memory sliding window
│           └── action-rate-limit.ts        ← Per-action rate limit wrapper
│
├── supabase/
│   └── migrations/                         ← 14 SQL migrations (see §17)
│
├── public/
│   └── bulletin_logo.png
│
├── CLAUDE.md
├── AGENTS.md
├── DOCUMENTATION.md                        ← This file
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts (inlined in globals.css)
├── playwright.config.ts
└── vitest.config.ts
```

---

## 4. Database Schema

### Entity Relationship Summary

```
auth.users (Supabase managed)
    │
    └── public.users (1:1 via id FK)
            │
            ├── organization_members ──── organizations
            │                                   │
            │                           announcements ──── categories
            │                                   │
            │                           announcement_reviews
            │                                   │
            │                           notifications
            │
            ├── invitations
            ├── audit_log
            └── password_reset_requests
```

### Tables

#### `public.users`

```sql
id               uuid PRIMARY KEY  → auth.users(id) ON DELETE CASCADE
email            text NOT NULL UNIQUE
display_name     text NOT NULL
role             user_role NOT NULL DEFAULT 'publisher'
avatar_url       text
force_password_change  boolean NOT NULL DEFAULT false
created_at       timestamptz NOT NULL DEFAULT now()
updated_at       timestamptz NOT NULL DEFAULT now()
```

> Extends Supabase Auth. Stores role + profile. Synced from auth metadata by trigger.

#### `public.organizations`

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
name         text NOT NULL UNIQUE
slug         text NOT NULL UNIQUE
description  text
logo_url     text
status       org_status NOT NULL DEFAULT 'pending'   -- pending|approved|rejected|suspended
owner_id     uuid → public.users(id) ON DELETE RESTRICT
approved_by  uuid → public.users(id)
approved_at  timestamptz
created_at / updated_at
```

#### `public.organization_members`

```sql
organization_id  uuid → organizations(id) ON DELETE CASCADE
user_id          uuid → users(id) ON DELETE CASCADE
member_role      org_member_role NOT NULL DEFAULT 'publisher'
PRIMARY KEY (organization_id, user_id)
```

#### `public.categories`

```sql
id          uuid PRIMARY KEY
name        text NOT NULL UNIQUE
slug        text NOT NULL UNIQUE
color       text   -- hex
is_active   boolean NOT NULL DEFAULT true
created_at  timestamptz
```

Seeded: Academic · Events · Sports · Student Life · Opportunities · General

#### `public.announcements`

```sql
id                  uuid PRIMARY KEY
title               text NOT NULL
body                text NOT NULL         -- Markdown
banner_url          text                  -- Supabase Storage URL
status              post_status NOT NULL DEFAULT 'draft'
                    -- draft | submitted | published | rejected | expired | archived
category_id         uuid → categories(id) ON DELETE SET NULL
organization_id     uuid NOT NULL → organizations(id) ON DELETE CASCADE
author_id           uuid NOT NULL → users(id) ON DELETE RESTRICT
registration_link   text
published_at        timestamptz
expires_at          timestamptz           -- auto: published_at + 30 days
archived_at         timestamptz
rejection_comment   text
scheduled_publish_at timestamptz          -- null = publish immediately
pinned_until        timestamptz
view_count          integer NOT NULL DEFAULT 0
urgency             announcement_urgency  -- low|normal|high|urgent
display_font        announcement_display_font
display_size        announcement_display_size
created_at / updated_at
```

#### `public.announcement_reviews`

```sql
id               uuid PRIMARY KEY
announcement_id  uuid → announcements(id) ON DELETE CASCADE
reviewer_id      uuid → users(id) ON DELETE RESTRICT
action           text CHECK (IN ('approved', 'rejected'))
comment          text
created_at       timestamptz
```

#### `public.invitations`

```sql
id          uuid PRIMARY KEY
email       text NOT NULL
role        user_role NOT NULL
org_ids     uuid[] NOT NULL DEFAULT '{}'
member_role org_member_role NOT NULL DEFAULT 'publisher'
token       text NOT NULL UNIQUE
invited_by  uuid → users(id) ON DELETE SET NULL
expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days'
accepted_at timestamptz
created_at  timestamptz
```

#### `public.audit_log`

```sql
id          uuid PRIMARY KEY
actor_id    uuid → users(id) ON DELETE SET NULL
action      text NOT NULL    -- e.g. 'auth.login', 'announcement.approved'
target_type text NOT NULL    -- 'announcement', 'user', 'session', etc.
target_id   text
metadata    jsonb
created_at  timestamptz NOT NULL DEFAULT now()
```

#### `public.notifications`

```sql
id               uuid PRIMARY KEY
recipient_id     uuid → users(id) ON DELETE CASCADE
actor_id         uuid → users(id) ON DELETE SET NULL
announcement_id  uuid → announcements(id) ON DELETE CASCADE
type             text CHECK (IN ('announcement_submitted', 'announcement_approved', 'announcement_rejected'))
title            text NOT NULL
body             text
href             text
read_at          timestamptz
created_at       timestamptz NOT NULL DEFAULT now()
```

#### `public.password_reset_requests`

```sql
id          uuid PRIMARY KEY
user_id     uuid NOT NULL → users(id) ON DELETE CASCADE
email       text NOT NULL
status      text NOT NULL DEFAULT 'pending'  -- pending|fulfilled|cancelled
created_at  timestamptz NOT NULL DEFAULT now()
fulfilled_at timestamptz
UNIQUE (user_id) WHERE status = 'pending'
```

#### `public.org_category_permissions`

```sql
org_id      uuid → organizations(id) ON DELETE CASCADE
category_id uuid → categories(id) ON DELETE CASCADE
granted_by  uuid → users(id) ON DELETE SET NULL
created_at  timestamptz
PRIMARY KEY (org_id, category_id)
```

### Enums

| Enum                        | Values                                                                    |
| --------------------------- | ------------------------------------------------------------------------- |
| `user_role`                 | `publisher` · `admin` · `super_admin`                                     |
| `post_status`               | `draft` · `submitted` · `published` · `rejected` · `expired` · `archived` |
| `org_status`                | `pending` · `approved` · `rejected` · `suspended`                         |
| `org_type`                  | (defined in schema)                                                       |
| `org_member_role`           | `publisher` · `admin`                                                     |
| `announcement_urgency`      | `low` · `normal` · `high` · `urgent`                                      |
| `announcement_display_font` | (serif/sans variants)                                                     |
| `announcement_display_size` | (sm/md/lg variants)                                                       |

> **Owner** is a special role stored in DB as a separate `owner` value added in migration 010 — it does NOT appear in `user_role` enum but is handled as `AppRole = UserRole | 'owner'` in application code.

### Key Database Functions & Triggers

```sql
-- Auto-set updated_at on every UPDATE
trg_users_updated_at / trg_organizations_updated_at / trg_announcements_updated_at
  → set_updated_at()

-- Auto-set expires_at = published_at + 30 days when status → 'published'
trg_announcements_set_expires
  → set_expires_at()

-- Sync new Supabase Auth user into public.users
trg_on_auth_user_created
  → handle_new_user()  [reads role from user_metadata via user_role_from_auth_metadata()]

-- Secure view-count increment (SECURITY DEFINER, no auth required)
increment_announcement_view(p_announcement_id uuid)
```

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table           | Policy                                                     |
| --------------- | ---------------------------------------------------------- |
| `announcements` | Public can SELECT published + non-scheduled + non-expired  |
| `announcements` | Publishers can INSERT/UPDATE own drafts/submitted/rejected |
| `announcements` | Admins can UPDATE for review (approve/reject)              |
| `users`         | Anyone can read own profile; super_admin can read all      |
| `organizations` | Approved orgs visible to authenticated; admins manage all  |
| `notifications` | Users can only read/update their own notifications         |
| `audit_log`     | Insert via service role only; owner reads all              |

---

## 5. Role & Permission System

### Role Hierarchy

```
Owner (level 0)
  └── Super Admin (level 1)
        └── Admin (level 2)
              └── Publisher (level 3)
```

Each role can access everything at their level and below.

### Role Capabilities

| Capability                        | Publisher | Admin | Super Admin | Owner |
| --------------------------------- | :-------: | :---: | :---------: | :---: |
| Browse public feed                |     ✓     |   ✓   |      ✓      |   ✓   |
| Create/edit announcements         |     ✓     |   ✓   |      ✓      |   ✓   |
| Submit for review                 |     ✓     |   ✓   |      ✓      |   ✓   |
| Review queue (approve/reject)     |     —     |   ✓   |      ✓      |   ✓   |
| Manage organizations              |     —     |   ✓   |      ✓      |   ✓   |
| Invite publishers                 |     —     |   ✓   |      ✓      |   ✓   |
| Manage categories                 |     —     |   ✓   |      ✓      |   ✓   |
| Invite admins                     |     —     |   —   |      ✓      |   ✓   |
| Reset user passwords              |     —     |   —   |      ✓      |   ✓   |
| View all users platform-wide      |     —     |   —   |      ✓      |   ✓   |
| Create users directly (no invite) |     —     |   —   |      —      |   ✓   |
| View audit log                    |     —     |   —   |      —      |   ✓   |
| Full CRUD on all users            |     —     |   —   |      —      |   ✓   |

### Route Guard (Layout)

Each route group layout calls `getCurrentAccessContext()` and enforces access:

```typescript
// src/lib/auth/authz.ts
export const ROLE_LEVEL: Record<AppRole, number> = {
  owner: 0,
  super_admin: 1,
  admin: 2,
  publisher: 3,
}

export function canAccessAdminArea(role: AppRole): boolean {
  return role === 'owner' || role === 'super_admin' || role === 'admin'
}

export function canManageUser(actor: ScopedUser, target: ScopedUser): boolean {
  if (target.id === actor.id || target.role === 'owner') return false
  if (actor.role === 'owner') return true
  if (actor.role === 'super_admin') return true
  if (actor.role === 'admin') {
    return hasOrgOverlap(actor.orgIds, target.orgIds) && target.role === 'publisher'
  }
  return false
}
```

### Org-Scoped Access

Admins are scoped to their `organization_members` rows. They can only see and manage publishers in their own organizations. Super admins and owners bypass org scoping.

---

## 6. Authentication Flows

### 6.1 Login Page

**Route:** `/login`

A split-panel card with Bulletin branding on the left and a credential form on the right.

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  BULLETIN                │  Sign in                 │
│          INTI International Uni  │                          │
│                                  │  [Email or username   ]  │
│  Welcome back                    │  [Password            ]  │
│                                  │                          │
│  Sign in to manage announcements │  [Sign In Button      ]  │
│  approvals, and campus comms.    │                          │
│                                  │  Forgot password?        │
│  AUTHORIZED PERSONNEL ONLY       │                          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

- Accepts **email** OR **username** (display_name lookup via service client)
- Rate-limited: 5 attempts per sliding window → `too_many_attempts` error
- On success: redirects to role-appropriate workspace (`/dashboard`, `/admin`, `/super-admin`, `/owner`)
- If `force_password_change = true`: redirects to `/change-password` before workspace
- Logs `auth.login` event to audit_log

**Core extract:**

```typescript
// src/app/(auth)/login/actions.ts
export async function login(formData: FormData) {
  let email = formData.get('email')?.trim() ?? ''
  const password = formData.get('password') ?? ''

  const rateLimit = await checkActionRateLimit('login', email)
  if (rateLimit.limited) redirect('/login?error=too_many_attempts')

  // Username login: no @ means look up the real email
  if (!email.includes('@')) {
    const { data: match } = await service
      .from('users')
      .select('email')
      .eq('display_name', email)
      .single()
    if (!match?.email) redirect('/login?error=invalid_credentials')
    email = match.email
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=invalid_credentials')
  // ...audit log, force_password_change check, role redirect
}
```

---

### 6.2 Forgot Password Page

**Route:** `/forgot-password`

```
┌──────────────────────────┐
│       [Logo 88×88]       │
│                          │
│      Reset access        │
│  Ask a super admin to    │
│  issue a temp password.  │
│                          │
│  [Email address        ] │
│  [Request reset        ] │
│                          │
│  ← Back to sign in       │
└──────────────────────────┘
```

**Flow:**

1. Publisher enters their email
2. System creates a `password_reset_requests` record (deduped by partial unique index)
3. In-app notifications are sent to all super admins and the owner
4. Super admin issues a temporary password (`BT-{base64url}`) + sets `force_password_change = true`
5. Publisher logs in → immediately redirected to `/change-password`

---

### 6.3 Change Password Page

**Route:** `/change-password`  
**Access:** Any authenticated user with `force_password_change = true`

Enforced on every login — user cannot access any workspace until the password is changed.

---

### 6.4 Registration Page

**Route:** `/register?token=<uuid>`

Invitation-only. A 7-day token from an admin invite email/link:

1. Token validated server-side (expiry + already-accepted check)
2. User picks display name + password
3. Account created via Supabase Admin client (service role)
4. Organization memberships inserted atomically
5. Invitation marked `accepted_at`
6. Redirect to `/login?registered=true`

---

## 7. Public Interface

### 7.1 Announcements Feed

**Route:** `/`  
**Auth required:** None

```
┌────────────────────────────────────────────────────────────────────┐
│  ● INTI International University                                   │
│                                                                    │
│  Campus                              │  Friday, 9 May 2026         │
│  Bulletin                            │                             │
│                                      │  24  Live posts             │
│  Official updates, events, deadlines │   6  Categories             │
│  and opportunities from INTI.        │                             │
├────────────────────────────────────────────────────────────────────┤
│  [Search announcements...    ] [Search] [Clear]                    │
│  [Academic] [Events] [Sports] [Student Life] [Opportunities]       │
├────────────────────────────────────────────────────────────────────┤
│  FEATURED                                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Banner Image]  Title of Featured Announcement              │  │
│  │                  Organization • Category  Published Apr 20   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ALL ANNOUNCEMENTS (23)                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                   │
│  │ Card 1     │  │ Card 2     │  │ Card 3     │                   │
│  │ Title      │  │ Title      │  │ Title      │                   │
│  │ Org · Cat  │  │ Org · Cat  │  │ Org · Cat  │                   │
│  └────────────┘  └────────────┘  └────────────┘                   │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**

- Featured post: pinned → has banner → first in feed
- Category filter pills (live via URL param `?category=slug`)
- Full-text search (`?q=term`) across title + body
- Masonry 3-column grid on xl screens
- View count tracking (anonymous) via `increment_announcement_view` RPC

---

### 7.2 Announcement Detail Page

**Route:** `/announcements/[id]`

```
┌────────────────────────────────────────────┐
│  ← Back    [Category Badge]                │
│                                            │
│  [Banner Image - full width]               │
│                                            │
│  # Announcement Title                      │
│  Organization · Published May 3, 2026      │
│                                            │
│  Announcement body in Markdown             │
│  with rich text rendering...               │
│                                            │
│  [Register / Apply link button]            │
│  👁 1,234 views                            │
└────────────────────────────────────────────┘
```

**Note:** Only published, non-expired, non-future-scheduled announcements are accessible. All others return 404.

---

## 8. Publisher Dashboard

### 8.1 Dashboard Home

**Route:** `/dashboard`  
**Required role:** publisher (or higher)

```
┌────────────────────────────────────────────────────────┐
│  Good morning, Osman                                   │
│  Manage INTI's announcements from here.                │
│                                                        │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │   3    │  │   1    │  │ 1,234  │  │   2    │       │
│  │Published│  │Scheduled│  │ Views │  │ Draft │       │
│  │/month  │  │        │  │ total  │  │       │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                        │
│  Recent                               View all →       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ● draft    Event Title 1        May 8 · 👁 0     │  │
│  │ ● published  Announcement 2     May 5 · 👁 456   │  │
│  └──────────────────────────────────────────────────┘  │
│                                          [+ New]       │
└────────────────────────────────────────────────────────┘
```

**Stats:** Published this month · Scheduled · Total views · In draft  
**FAB:** Fixed `+` button bottom-right → `/dashboard/announcements/new`

---

### 8.2 Announcements List

**Route:** `/dashboard/announcements`

Table with status badges, view counts, dates. Filter by status. Click row to edit.

---

### 8.3 Announcement Editor (New / Edit)

**Routes:** `/dashboard/announcements/new` · `/dashboard/announcements/[id]/edit`

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                              [Save Draft] [Submit]      │
│                                                                  │
│  ┌───────────────────────────────┐  ┌──────────────────────────┐ │
│  │  Title (120 char max)         │  │  PREVIEW                 │ │
│  │                               │  │                          │ │
│  │  Body (Markdown editor)       │  │  Rendered card preview   │ │
│  │  ─────────────────────        │  │                          │ │
│  │                               │  │                          │ │
│  │  OPTIONS                      │  │                          │ │
│  │  Category: [dropdown]         │  │                          │ │
│  │  Banner URL: [input]          │  │                          │ │
│  │  Register Link: [input]       │  │                          │ │
│  │  Expires at: [date]           │  │                          │ │
│  │  Scheduled publish: [date]    │  │                          │ │
│  │  Pin until: [date]            │  │                          │ │
│  │  Urgency: [low/normal/high]   │  │                          │ │
│  │  Font: [serif/sans]           │  │                          │ │
│  │  Size: [sm/md/lg]             │  │                          │ │
│  └───────────────────────────────┘  └──────────────────────────┘ │
│                                      Autosave: Saved ✓           │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**

- **Autosave** every 3 seconds when content changes (debounced)
- **Live preview** renders announcement card in real-time
- **Presentation controls**: font (serif/sans), size (sm/md/lg), urgency (low/normal/high/urgent)
- **Scheduled publish**: set future date; announcement stays hidden until then
- **Pinned until**: mark as pinned/featured until a date
- Two save paths: `Save Draft` (keeps draft) or `Submit` (moves to review queue)

---

### 8.4 Publisher Settings

**Route:** `/dashboard/settings`

- Update display name
- Change password

---

## 9. Admin Dashboard

### 9.1 Admin Overview

**Route:** `/admin`  
**Required role:** admin (or higher)

```
┌────────────────────────────────────────────────────────┐
│  Admin Panel                                           │
│  Review announcements and manage the platform.         │
│                                                        │
│  ┌──────────────┐  ┌──────────┐  ┌──────┐  ┌──────┐   │
│  │  3 Pending   │  │ 12 Pub.  │  │  4   │  │ 23   │   │
│  │  Review ●    │  │ /month   │  │ Orgs │  │ Pubs │   │
│  └──────────────┘  └──────────┘  └──────┘  └──────┘   │
│                                                        │
│  REVIEW QUEUE                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ [submitted] Spring Festival  CS Dept · Apr 30  │    │
│  │ [submitted] Scholarship Appln  May 1           │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

### 9.2 Review Queue

**Route:** `/admin/review`

Lists all `submitted` announcements. Badge on sidebar nav shows pending count.

---

### 9.3 Announcement Review

**Route:** `/admin/review/[id]`

```
┌──────────────────────────────────────────────────────┐
│  ← Review Queue                                      │
│                                                      │
│  [Full rendered announcement preview]                │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │  REVIEWER ACTIONS                             │   │
│  │                                               │   │
│  │  Comment (optional): [text area]              │   │
│  │                                               │   │
│  │  [Reject]                    [Approve →]      │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**On Approve:**

- Status → `published` (or stays scheduled if `scheduled_publish_at` in future)
- `announcement_reviews` record written
- Notification sent to publisher

**On Reject:**

- Status → `rejected` with `rejection_comment`
- Notification sent to publisher

---

### 9.4 Organizations

**Route:** `/admin/orgs`

List of organizations with status, publisher count. Create new organization.

---

### 9.5 Publishers

**Route:** `/admin/publishers`

List of org-scoped publishers. Invite new publishers via token link.

---

### 9.6 Admin Users

**Route:** `/admin/users`

View publishers in the admin's organizations. Manage roles (admin → publisher only).

---

### 9.7 Categories

**Route:** `/admin/categories`

View and toggle active categories. Manage org-category permissions.

---

### 9.8 Analytics

**Route:** `/admin/analytics`

Org-scoped announcement analytics: view counts, publish rates, category breakdown.

---

## 10. Super Admin Dashboard

### 10.1 Platform Overview

**Route:** `/super-admin`  
**Required role:** super_admin (or higher)

```
┌────────────────────────────────────────────────────────┐
│  Platform Overview                                     │
│  Full administrative control over Bulletin.            │
│                                                        │
│  [142 Total] [89 Published] [3 Pending] [8 Orgs] [45 Users] │
│                                                        │
│  QUICK LINKS                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────┐  ┌──────┐  │
│  │ 🛡 Admins  │  │ 🏷 Categories│  │ 👤 Users│  │ 📊   │  │
│  │ Manage     │  │ Create &   │  │ View & │  │ Anal.│  │
│  │ admins     │  │ manage     │  │ reset  │  │      │  │
│  └────────────┘  └────────────┘  └────────┘  └──────┘  │
└────────────────────────────────────────────────────────┘
```

---

### 10.2 Users (Super Admin)

**Route:** `/super-admin/users`

Platform-wide user list. Two password-reset flows:

- **Direct reset:** Generate `BT-{base64url}` temp password → copy to clipboard → give to user
- **Request fulfillment:** View and fulfill `password_reset_requests` from publishers

---

### 10.3 Admins

**Route:** `/super-admin/admins`

List all admin-role users. Invite new admins.

---

## 11. Owner Dashboard

### 11.1 System Overview

**Route:** `/owner`  
**Required role:** owner only

The highest-privilege workspace. Full visibility and control over everything.

```
┌────────────────────────────────────────────────────────┐
│  👑 System Overview                                    │
│  Owner-level administrative control.                   │
│                                                        │
│  [Total Users] [Active Orgs] [All Announcements] ...   │
│                                                        │
│  NAVIGATION                                            │
│  ├── System (this page)                                │
│  ├── Super Admin Workspace → /super-admin              │
│  ├── Admin Workspace → /admin                          │
│  ├── Publisher Workspace → /dashboard                  │
│  ├── Analytics → /owner/analytics                      │
│  ├── Resources → /owner/resources                      │
│  ├── All Users → /owner/users                          │
│  ├── Categories → /owner/categories                    │
│  ├── Audit Log → /owner/audit                          │
│  └── Settings → /owner/settings                        │
└────────────────────────────────────────────────────────┘
```

---

### 11.2 Resources

**Route:** `/owner/resources`

Read-only owner-only operations view:

- Internal announcement view counters and top viewed announcements
- Views by category and organization
- `banner-images` storage file count and byte footprint
- Pending password reset requests
- Setup route enabled/disabled status
- Optional Vercel production deployment status when `VERCEL_API_TOKEN` and `VERCEL_PROJECT_ID` are configured
- Optional Supabase project health when `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are configured

No raw tokens, service keys, database URLs, or environment variable values are rendered.

---

### 11.3 All Users (Owner)

**Route:** `/owner/users`

Full CRUD on every user (excluding other owners). Capabilities beyond super admin:

- Create users directly (auto-generates `@bulletin.internal` email)
- Assign any role including super_admin
- Delete users

---

### 11.4 Audit Log

**Route:** `/owner/audit`

```
┌──────────────────────────────────────────────────────────────────┐
│  Audit Log                                                        │
│  Immutable record of all privileged actions.                     │
│                                                                  │
│  WHEN              WHO         ACTION                TARGET       │
│  ─────────────────────────────────────────────────────────────── │
│  May 9 13:04       Osman       auth.login           session       │
│  May 9 12:51       Osman       announcement.submit  announce.id   │
│  May 9 12:48       AdminUser   announcement.approve announce.id   │
│  May 8 23:40       Osman       user.create          user.id       │
└──────────────────────────────────────────────────────────────────┘
```

**Audit events logged:**

- `auth.login` · `auth.logout`
- `announcement.submit` · `announcement.approve` · `announcement.reject`
- `announcement.publish` · `announcement.unpublish` · `announcement.delete`
- `user.create` · `user.update_role` · `user.password_reset`
- `org.create` · `org.approve` · `org.reject`
- `invite.send` · `invite.accept`

---

## 12. Core Library Architecture

### `src/lib/auth/authz.ts`

The central authorization module. All role checks go through here.

```typescript
// Role numeric levels — lower = more privileged
export const ROLE_LEVEL: Record<AppRole, number> = {
  owner: 0,
  super_admin: 1,
  admin: 2,
  publisher: 3,
}

// Memoized via React cache() — one DB round-trip per request
export const getCurrentAccessContext = cache(async function (): Promise<AccessContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, role, force_password_change')
      .eq('id', user.id)
      .single(),
    supabase.from('organization_members').select('organization_id').eq('user_id', user.id),
  ])

  return {
    userId: user.id,
    displayName: profile.display_name ?? null,
    role: profile.role as AppRole,
    forcePasswordChange: Boolean(profile.force_password_change),
    orgIds: memberships.map((m) => m.organization_id),
  }
})
```

### `src/lib/data.ts`

All Supabase query functions. Key examples:

```typescript
// Public feed: published, scheduled-past, not-expired, sorted
export async function getPublicAnnouncements(
  categorySlug?,
  searchQuery?
): Promise<AnnouncementWithRelations[]>

// Admin stats
export async function getAdminStats(): Promise<{
  pendingReview
  publishedThisMonth
  totalOrgs
  totalPublishers
}>

// Platform stats (super admin)
export async function getPlatformStats(): Promise<{
  totalAnnouncements
  publishedCount
  pendingReview
  totalOrgs
  totalUsers
}>
```

### `src/lib/announcements/access.ts`

Determines which organization an announcement should be scoped to:

```typescript
// Publishers write to their first org; admins/SA/owner fall back to oldest org
export function resolveAnnouncementOrgId(access: AccessContext): string | null

// Should this user's announcements query be scoped to their org memberships?
export function shouldScopeAnnouncementsToMembership(access: AccessContext): boolean
```

### `src/lib/announcements/presentation.ts`

Display metadata for announcement rendering:

```typescript
export const ANNOUNCEMENT_URGENCIES = ['low', 'normal', 'high', 'urgent'] as const
export const URGENCY_META = {
  urgent: { label: 'Urgent', color: '#EF4444', icon: AlertTriangle },
  high:   { label: 'High',   color: '#F59E0B', icon: AlertCircle },
  ...
}

// Is an announcement currently pinned?
export function isAnnouncementPinned(announcement: DbAnnouncement): boolean {
  return announcement.pinned_until != null && new Date(announcement.pinned_until) > new Date()
}
```

### `src/lib/supabase/`

Three client creators:

- **`client.ts`** — Browser client (anon key, RLS active)
- **`server.ts`** — SSR client (cookies, anon key, RLS active)
- **`admin.ts`** — Service role client (bypasses RLS — only used for user creation, audit, invite validation)

---

## 13. Security Architecture

### Rate Limiting

```typescript
// src/lib/security/rate-limit.ts
// In-memory sliding window — resets on restart, not shared across instances
// Login: 5 attempts / 60s per identifier
// Password reset: 3 attempts / 300s
```

**Note:** This is a single-instance in-memory store. For multi-instance deployments, replace with Redis-backed rate limiting.

### Input Validation

- All form data validated in Server Actions before DB write
- Search query sanitized: strips `%`, `,`, `(`, `)`, truncates at 80 chars
- Role input sanitized on invite/create (whitelist comparison)
- `return_to` redirect parameter validated against a hardcoded whitelist of safe paths

### SQL Injection Prevention

Supabase JS client uses parameterized queries throughout. No raw SQL is constructed from user input.

### XSS Prevention

- Announcement body rendered via `react-markdown` with no `dangerouslySetInnerHTML`
- Registration link shown as a controlled `<a>` element (URL validated for protocol)

### Auth Security

- No email enumeration on forgot-password (always returns success message)
- `force_password_change` enforced server-side on every login redirect
- Temp passwords are `BT-{16-byte-base64url}` (~96 bits entropy)
- Session managed by Supabase Auth (httpOnly cookies via `@supabase/ssr`)

### RLS as Defense-in-Depth

Row Level Security on all tables means even if application-layer auth is bypassed, the database enforces access. The owner's profile cannot be managed by any other role at the DB level.

---

## 14. Notifications System

Publishers receive in-app notifications when their submissions are reviewed.

### Notification Types

| Type                     | Trigger           | Recipients             |
| ------------------------ | ----------------- | ---------------------- |
| `announcement_submitted` | Publisher submits | All admins in the org  |
| `announcement_approved`  | Admin approves    | The publisher (author) |
| `announcement_rejected`  | Admin rejects     | The publisher (author) |

### Notification Bell (Top Nav)

- Unread count badge on bell icon in `DashboardTopNav`
- Click opens `NotificationsPanel` slide-out drawer
- Marking as read calls `markNotificationRead` server action

```typescript
// NotificationsPanel.tsx — slide-out drawer
// Shows title, body, relative timestamp
// Links directly to the announcement if href is set
// Marks all as read when panel opens
```

---

## 15. Audit Log

Every privileged action writes to `public.audit_log` via `logAuditEvent()`:

```typescript
// src/lib/audit.ts
export async function logAuditEvent({ actorId, action, targetType, targetId, metadata }) {
  // Uses service role client (bypasses RLS)
  await supabase.from('audit_log').insert({ actor_id, action, target_type, target_id, metadata })
  // Revalidates /owner and /owner/audit pages
  OWNER_AUDIT_PATHS.forEach((path) => revalidatePath(path))
}
```

The audit log is append-only (no UPDATE/DELETE policies defined). Only the owner can read it via the UI.

---

## 16. API Routes

The app has exactly **one API route**:

### `POST /api/setup`

```typescript
// src/app/api/setup/route.ts
// One-time bootstrap: creates the owner account
// Should be deleted or gated after initial setup
// Credentials hardcoded — MUST be removed from source before production
```

> **Security note:** This endpoint should be deleted after initial deployment or protected with an environment variable gate.

All other data mutations are handled by **Next.js Server Actions** (not REST endpoints).

---

## 17. Migration History

| #   | File                                           | Description                                                                            |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| 01  | `20260411000001_schema.sql`                    | Core tables: users, organizations, categories, announcements                           |
| 02  | `20260411000002_rls.sql`                       | Row Level Security policies                                                            |
| 03  | `20260411000003_storage.sql`                   | Supabase Storage buckets for banners                                                   |
| 04  | `20260418000004_fixes_and_additions.sql`       | Invitations table, audit_log, bug fixes                                                |
| 05  | `20260418000005_fix_rls_recursion.sql`         | Fix RLS infinite recursion (first pass)                                                |
| 06  | `20260418000006_fix_rls_recursion_final.sql`   | Fix RLS recursion (second pass)                                                        |
| 07  | `20260418000007_fix_org_members_recursion.sql` | Fix org_members RLS recursion                                                          |
| 08  | `20260502000008_post_status_enums.sql`         | Add `submitted` and `rejected` to post_status enum                                     |
| 09  | `20260502000009_role_system.sql`               | org_member_role, announcement_reviews, org_category_permissions, force_password_change |
| 10  | `20260503000010_owner_role.sql`                | Add `owner` to user_role enum; provision owner account                                 |
| 11  | `20260507000011_sync_auth_users.sql`           | Harden auth trigger: validate role from metadata; backfill orphaned profiles           |
| 12  | `20260507000012_announcement_presentation.sql` | Add urgency, display_font, display_size columns                                        |
| 13  | `20260508000013_announcement_workflow.sql`     | Scheduled publishing, pinned posts, view_count, notifications table                    |
| 14  | `20260508000014_password_reset_requests.sql`   | password_reset_requests table + notifications type constraint update                   |

---

## 18. Design System & Theming

### Typography

```
--font-sans        Libre Franklin (300–700) — body text
--font-display     Newsreader (400–700)     — hero headings (h1, .font-display)
--font-mono        Geist Mono               — stats, counters, code
```

### Color Tokens (CSS variables)

```css
/* Light Mode */
--color-canvas          oklch(0.982 0.008 72)    /* page background */
--color-surface         oklch(0.995 0.003 72)    /* card surfaces */
--color-surface-elevated  (slightly darker)
--color-text-primary    oklch(0.16 0.01 54)
--color-text-muted      oklch(0.52 0.015 54)
--color-accent-inti     oklch(0.56 0.14 23)      /* INTI brand red-orange */
--color-accent-hover    (darker shade)
--color-gold            oklch(0.72 0.12 75)      /* Owner crown */
--color-navy            oklch(0.22 0.04 250)
```

Dark mode inverts the surface and text tokens; the accent-inti brand color is preserved.

### Status Colors

| Status      | Text color | Background   |
| ----------- | ---------- | ------------ |
| `published` | Green      | Light green  |
| `draft`     | Gray       | Light gray   |
| `submitted` | Blue       | Light blue   |
| `rejected`  | Red        | Light red    |
| `expired`   | Orange     | Light orange |
| `archived`  | Purple     | Light purple |

### Component Patterns

- **GlassCard** — translucent surface with subtle border, `hover` prop adds lift effect
- **StatusBadge** — colored pill for announcement lifecycle states
- **CountUp** — animates a number from 0 to value on mount
- **ActionBar** — sticky bottom bar with Save/Submit/Publish actions
- **AutosaveIndicator** — "Saving…" / "Saved ✓" state indicator
- **NotificationsPanel** — slide-in drawer from top-right
- **DashboardSidebar** — collapsible (icon-only at md, full at lg); mobile bottom drawer

---

## 19. Testing

### Unit Tests (Vitest)

```
vitest run
```

Tests cover utility functions and library helpers in `src/lib/`.

### E2E Tests (Playwright)

```
playwright test
playwright test --ui    # interactive mode
```

Tests cover:

- Login flow (valid credentials, invalid credentials, rate limit)
- Announcement CRUD lifecycle (create → submit → approve → published)
- Role-based route access (unauthorized redirects)
- Password change enforcement

### Test Data

A seed script (`seed-test-users.js`) creates test users for each role in the Supabase project.

---

## 20. Deployment

### Environment Variables

```bash
# Required in Vercel / .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Never expose client-side

# Optional /owner/resources read-only cards
VERCEL_API_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
```

### Deployment Steps

1. Push to `main` → Vercel auto-deploys
2. Run `supabase db push` to apply any new migrations
3. Verify environment variables are set in Vercel project settings

### Architecture Notes

- **No middleware.ts** — route protection is handled in each layout's server component
- **Server Actions** are the primary mutation path (no separate API layer)
- **React `cache()`** memoizes `getCurrentAccessContext()` — one auth DB hit per request
- **RLS** is the last line of defense at the database level
- **No middleware edge protection** — a middleware.ts could be added for faster redirects

---

## Appendix: Pages at a Glance

| Route                                | Role          | Description                                           |
| ------------------------------------ | ------------- | ----------------------------------------------------- |
| `/`                                  | Public        | Announcement feed                                     |
| `/announcements/[id]`                | Public        | Announcement detail                                   |
| `/login`                             | Public        | Sign in                                               |
| `/forgot-password`                   | Public        | Request password reset                                |
| `/change-password`                   | Authenticated | Force-change password                                 |
| `/register?token=`                   | Token holder  | Invitation registration                               |
| `/dashboard`                         | Publisher+    | Publisher home (stats)                                |
| `/dashboard/announcements`           | Publisher+    | My announcements list                                 |
| `/dashboard/announcements/new`       | Publisher+    | Create announcement                                   |
| `/dashboard/announcements/[id]/edit` | Publisher+    | Edit announcement                                     |
| `/dashboard/notifications`           | Publisher+    | Notification inbox                                    |
| `/dashboard/settings`                | Publisher+    | Account settings                                      |
| `/admin`                             | Admin+        | Admin overview                                        |
| `/admin/review`                      | Admin+        | Review queue                                          |
| `/admin/review/[id]`                 | Admin+        | Review single announcement                            |
| `/admin/orgs`                        | Admin+        | Organizations                                         |
| `/admin/orgs/new`                    | Admin+        | Create organization                                   |
| `/admin/publishers`                  | Admin+        | Publishers list                                       |
| `/admin/publishers/invite`           | Admin+        | Invite publisher                                      |
| `/admin/users`                       | Admin+        | User role management                                  |
| `/admin/categories`                  | Admin+        | Category management                                   |
| `/admin/analytics`                   | Admin+        | Org analytics                                         |
| `/admin/settings`                    | Admin+        | Admin settings                                        |
| `/super-admin`                       | Super Admin+  | Platform overview                                     |
| `/super-admin/admins`                | Super Admin+  | Admins list                                           |
| `/super-admin/admins/invite`         | Super Admin+  | Invite admin                                          |
| `/super-admin/users`                 | Super Admin+  | All users + password reset                            |
| `/super-admin/categories`            | Super Admin+  | Platform categories                                   |
| `/super-admin/analytics`             | Super Admin+  | Platform analytics                                    |
| `/super-admin/settings`              | Super Admin+  | Super admin settings                                  |
| `/owner`                             | Owner         | System overview                                       |
| `/owner/users`                       | Owner         | Full user CRUD                                        |
| `/owner/categories`                  | Owner         | Categories                                            |
| `/owner/analytics`                   | Owner         | Full analytics                                        |
| `/owner/resources`                   | Owner         | Read-only Vercel/Supabase resources and view counters |
| `/owner/audit`                       | Owner         | Audit log                                             |
| `/owner/settings`                    | Owner         | Owner settings                                        |
| `/api/setup`                         | Internal      | Bootstrap owner (one-time)                            |

---

_Documentation generated 2026-05-09. To take live screenshots of each page, start the dev server with `npm run dev` and visit each route with the appropriate test account._
