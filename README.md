# Bulletin

A governed announcement platform for INTI International University. Public-facing feed with a four-tier role system, editorial presentation controls, in-app notifications, view tracking, and a full audit trail.

**Stack:** Next.js 16.2.3 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + RLS + Auth + Storage) · Vercel · Speed Insights

---

## Role System

Four authenticated tiers, each with a dedicated route group and dashboard. The public feed requires no login.

| Role            | Who                                    | Can do                                                                                               |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Public**      | Anyone                                 | Browse the feed, read announcements — no login required                                              |
| **Publisher**   | Clubs, departments, societies          | Create drafts, submit for review, manage own announcements, receive review notifications             |
| **Admin**       | SA Director, Student Council President | Approve/reject submissions, manage publishers, orgs, categories, users — notified on new submissions |
| **Super Admin** | Platform administrators                | Manage admins, global categories, platform analytics, password resets                                |
| **Owner**       | Platform owner (Maaney)                | Full audit log, all metrics, all user management — bypasses RLS                                      |

Login automatically routes each role to its panel.

---

## Features

### Public feed

- Announcement grid with featured first-card layout
- Database-backed search and category filter via URL search params
- Markdown-stripped excerpts on cards
- Full detail view with optional safe `http`/`https` registration link
- View count tracked per announcement (via RPC — safe for unauthenticated users)
- Back navigation on detail pages with a direct-load fallback to `/`
- Pinned announcements surfaced above the fold (until `pinned_until` expires)
- Scheduled posts hidden until their publish time
- Hero section with editorial stats panel (live post count, active topics) and pulsing INTI dot
- Dynamic XML sitemap generated from all published announcements
- `robots.txt` blocking auth, dashboard, admin, and owner routes from crawlers
- Canonical URL resolved from `NEXT_PUBLIC_APP_URL` with production fallback to `bulletininti.vercel.app`

### Publisher dashboard

- Create and edit announcements with rich presentation controls:
  - **Urgency** — `normal` · `important` · `urgent`
  - **Display font** — `editorial` · `clean`
  - **Display size** — `compact` · `standard` · `large`
- Banner image upload to the Supabase `banner-images` storage bucket
- Draft autosave with visual indicator
- Schedule a future publish time (`scheduled_publish_at`)
- Edit rejected announcements and resubmit
- Status tracking across full lifecycle
- In-app notifications: approval, rejection (with comment), scheduled publish confirmation

### Admin panel

- Review queue — approve or reject submitted announcements
- Rejection comments are required and sent to the publisher as a notification
- Publisher invite flow with copyable invite link
- Organization management
- Category management
- User management
- Analytics dashboard
- In-app notifications for new submissions

### Super admin panel

- Admin invite and management
- Global category control
- Platform-wide analytics
- User password resets and forgot-password request queue
- In-app notifications

### Owner panel

- Bento dashboard: user role breakdown chart, publish-rate donut, pending review count, recent audit feed
- Full paginated audit log (50 per page, newest first)
- Resource page for Vercel deployment status, Supabase health, banner storage, setup-route status, and view counters
- All-user management
- Owner-level analytics
- In-app notifications

### Notifications

In-app notification system covering the full review workflow:

| Event                          | Who is notified                               |
| ------------------------------ | --------------------------------------------- |
| Publisher submits announcement | All admins, super admins, and owner           |
| Admin approves announcement    | Publisher (with scheduled time if applicable) |
| Admin rejects announcement     | Publisher (with rejection comment)            |

Notifications are per-user, have unread state, and link directly to the relevant page. Delivered via the `NotificationsPanel` component available in all role dashboards.

### Security

- IP-based rate limiting on all public routes
- Server action rate limiting
- Row-level security on all database tables
- Service-role client for owner/admin queries that bypass RLS
- Server-side validation for announcement banner URLs and registration links
- Next image allow-list scoped to the configured Supabase `banner-images` bucket
- One-time bootstrap endpoint (`/api/setup`) disabled by default and protected by `SETUP_SECRET`
- Idle logout on all authenticated sessions
- Admin-created and reset passwords force a password change on next login

---

## Announcement Lifecycle

```
Draft → Submitted → Published → Expired (auto at 30 days) → Archived
                ↓
            Rejected → (publisher edits) → Submitted
```

Publishers save drafts and submit for admin review. Admins approve or reject; rejections require a comment so publishers know what to change. Rejected announcements can be revised and resubmitted. Published announcements auto-expire after 30 days.

**Scheduled publishing:** Approved announcements with a `scheduled_publish_at` in the future are not visible on the public feed until that time passes. The RLS policy and the public query both enforce this.

**Pinned posts:** Announcements with an active `pinned_until` timestamp are surfaced above the normal grid. Pinning expires automatically.

---

## Audit Log

Every significant system action writes a row to `audit_log`:

| Field         | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `actor_id`    | User who performed the action (with display name + role)        |
| `action`      | What was done (e.g. `approve_announcement`, `invite_publisher`) |
| `target_type` | What was acted on (e.g. `announcement`, `user`)                 |
| `target_id`   | ID of the affected record                                       |
| `metadata`    | Additional context as JSON                                      |
| `created_at`  | Timestamp                                                       |

The owner dashboard shows the 6 most recent entries. `/owner/audit` shows the full paginated log. Only the owner can read this table — append-only, no editing. Owner dashboard paths are revalidated automatically after each write.

---

## Routes

### Public

| Route                 | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `/`                   | Announcement feed with category filter, pinned posts, scheduled post enforcement |
| `/announcements/[id]` | Full announcement detail (increments view count)                                 |

### Auth

| Route              | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `/login`           | Email/username + password (routes to role dashboard on success) |
| `/forgot-password` | Submit email to request an administrator password reset         |
| `/change-password` | Forced password change flow                                     |
| `/register`        | Account registration                                            |

### Publisher — `/dashboard`

| Route                                | Description                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| `/dashboard`                         | Overview stats and quick actions                            |
| `/dashboard/announcements`           | All announcements with status badges                        |
| `/dashboard/announcements/new`       | Create announcement (with scheduled publish option)         |
| `/dashboard/announcements/[id]/edit` | Edit announcement (available on draft, submitted, rejected) |
| `/dashboard/notifications`           | In-app notification inbox                                   |
| `/dashboard/settings`                | Account name, password, theme, and workspace shortcuts      |

### Admin — `/admin`

| Route                      | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| `/admin`                   | Overview with pending count and quick links                             |
| `/admin/review`            | Review queue                                                            |
| `/admin/review/[id]`       | Review detail — approve (with optional schedule) or return with comment |
| `/admin/publishers`        | Publisher list                                                          |
| `/admin/publishers/invite` | Invite new publisher (with copyable link)                               |
| `/admin/orgs`              | Organization list                                                       |
| `/admin/orgs/new`          | Create organization                                                     |
| `/admin/categories`        | Category management                                                     |
| `/admin/users`             | User management                                                         |
| `/admin/analytics`         | Admin analytics                                                         |
| `/admin/notifications`     | In-app notification inbox                                               |
| `/admin/settings`          | Account name, password, theme, and workspace shortcuts                  |

### Super Admin — `/super-admin`

| Route                        | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `/super-admin`               | Platform overview                                      |
| `/super-admin/admins`        | Admin list                                             |
| `/super-admin/admins/invite` | Invite new admin                                       |
| `/super-admin/categories`    | Global category management                             |
| `/super-admin/users`         | All users with password reset                          |
| `/super-admin/analytics`     | Platform analytics                                     |
| `/super-admin/notifications` | In-app notification inbox                              |
| `/super-admin/settings`      | Account name, password, theme, and workspace shortcuts |

### Owner — `/owner`

| Route                  | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `/owner`               | Bento dashboard: role breakdown, publish rate, audit feed |
| `/owner/users`         | All users                                                 |
| `/owner/analytics`     | Owner analytics                                           |
| `/owner/resources`     | Server health, storage usage, and view counters           |
| `/owner/audit`         | Full audit log (paginated, 50/page)                       |
| `/owner/notifications` | In-app notification inbox                                 |
| `/owner/settings`      | Account name, password, theme, and workspace shortcuts    |

### API

| Route        | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `/api/setup` | One-time owner bootstrap — disabled unless `ENABLE_SETUP_ROUTE=1` |

---

## Database

14 migrations. Run them in order from `supabase/migrations/` in the Supabase SQL editor.

| File                               | Description                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `000001_schema`                    | Core tables: users, organizations, organization_members, categories, announcements                               |
| `000002_rls`                       | Row-level security policies for all tables                                                                       |
| `000003_storage`                   | `banner-images` bucket + storage RLS                                                                             |
| `000004–007`                       | RLS recursion fixes for org_members (Supabase gotcha)                                                            |
| `000008_post_status_enums`         | Announcement status enum                                                                                         |
| `000009_role_system`               | User role enum and RBAC policies                                                                                 |
| `000010_owner_role`                | Owner role schema                                                                                                |
| `000011_sync_auth_users`           | Trigger: sync `auth.users` → `public.users`                                                                      |
| `000012_announcement_presentation` | `urgency`, `display_font`, `display_size` columns                                                                |
| `000013_announcement_workflow`     | `scheduled_publish_at`, `pinned_until`, `view_count` + `notifications` table + `increment_announcement_view` RPC |
| `000014_password_reset_requests`   | Forgot-password reset request queue + password reset notifications                                               |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Osman6202/Bulletin.git
cd Bulletin
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_SETUP_ROUTE=0
SETUP_SECRET=choose-a-strong-secret

# Optional owner-only resource cards
VERCEL_API_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
```

### 3. Run migrations

In the Supabase SQL editor, paste and run each file from `supabase/migrations/` in filename order (all 14).

Migration `000003_storage` creates the public `banner-images` bucket used by announcement banner uploads. Keep that bucket name unchanged unless you also update `next.config.ts` and the announcement form validation helpers.

### 4. Bootstrap the owner account

Temporarily set `ENABLE_SETUP_ROUTE=1` in the running environment, then run:

```powershell
# PowerShell
./scripts/setup-owner.ps1
```

Or with curl:

```bash
curl -X POST http://localhost:3000/api/setup \
  -H "x-setup-secret: your-secret"
```

The bootstrap route creates or resets the built-in owner login `osman_owner` and returns a temporary password. The next login forces a password change.

> Set `ENABLE_SETUP_ROUTE=0` or remove it after the owner account is created.

### 5. Start dev server

```bash
npm run dev
```

---

## Testing

### Unit tests (Vitest)

```bash
npm test
```

9 test files: authz, announcement form validation, feed queries, rate limiting, setup route security, presentation constants, Future Commons UI, SEO URL helpers, brand lab.

### E2E tests (Playwright)

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode
```

6 spec files: auth, feed, routing, setup-route, users, public theme.
Runs on Desktop Chrome, Desktop Safari, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 13).

Seed test accounts before running E2E:

```bash
node scripts/seed-test-users.js
```

### CI (GitHub Actions)

Runs on every push and pull request:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run test:e2e` (chromium + webkit)

Required repository secrets: `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY`, `TEST_SETUP_SECRET`, and email/password pairs for each test role (owner, super_admin, admin, publisher, force_change).

### Owner resource integrations

`/owner/resources` always shows internal app metrics: total announcement views, top viewed announcements, banner storage file count, pending password reset requests, and setup-route status.

External Vercel and Supabase cards are optional:

- Vercel: set `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, and optionally `VERCEL_TEAM_ID`.
- Supabase: set `SUPABASE_ACCESS_TOKEN` and optionally `SUPABASE_PROJECT_REF`; when blank, the project ref is inferred from `NEXT_PUBLIC_SUPABASE_URL`.

Keep these variables server-only. Do not prefix them with `NEXT_PUBLIC_`, and do not display raw token values in UI or logs.

### Security audit note

`npm audit --omit=dev` currently reports a moderate PostCSS advisory under Next.js 16.2.3's bundled dependency tree. `npm audit fix --force` suggests downgrading Next to `9.3.3`, so do not run the forced fix. Leave this to an upstream Next patch or a deliberate Next upgrade.

---

## Commands

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start development server     |
| `npm run build`        | Production build             |
| `npm run start`        | Start production server      |
| `npm run lint`         | ESLint                       |
| `npm run format`       | Prettier (write)             |
| `npm run format:check` | Prettier (check only)        |
| `npm test`             | Unit tests                   |
| `npm run test:watch`   | Unit tests in watch mode     |
| `npm run test:e2e`     | E2E tests                    |
| `npm run test:e2e:ui`  | E2E tests with Playwright UI |

---

## Project Structure

```
Bulletin/
├── src/
│   ├── app/
│   │   ├── (public)/             # Feed, announcement detail (+ ViewTracker, view actions)
│   │   ├── (auth)/               # Login, forgot-password, register, change-password
│   │   ├── (dashboard)/          # Publisher dashboard + notifications
│   │   ├── (admin)/              # Admin panel + notifications
│   │   ├── (super-admin)/        # Super admin panel + notifications
│   │   ├── (owner)/              # Owner panel + notifications
│   │   ├── brand-lab/            # Design token and component showcase (internal)
│   │   ├── api/setup/            # One-time bootstrap endpoint (disabled by default)
│   │   ├── robots.ts             # robots.txt — blocks auth/dashboard/admin/owner from crawlers
│   │   ├── sitemap.ts            # Dynamic XML sitemap from published announcements
│   │   └── layout.tsx            # Root layout (Atkinson Hyperlegible + Bricolage Grotesque + Geist Mono)
│   ├── components/
│   │   ├── announcements/        # AnnouncementCard, CategoryFilter, BackButton
│   │   ├── navigation/           # BackNavButton (history-aware back navigation with fallback)
│   │   ├── account/              # Account settings forms and password controls
│   │   ├── auth/                 # IdleLogout
│   │   ├── dashboard/            # AnnouncementForm, AnnouncementRow, DashboardShell,
│   │   │                         # DashboardSidebar, DashboardTopNav, StatusBadge,
│   │   │                         # GlassCard, AutosaveIndicator, CountUp, ActionBar,
│   │   │                         # NotificationsPanel
│   │   └── layout/               # Header, BrandMark (multi-size logo+wordmark), ThemeToggle
│   └── lib/
│       ├── account/              # Account settings and password update helpers
│       ├── announcements/        # Feed helpers, access control, presentation constants, URL/slug helpers
│       ├── auth/                 # Authorization, auth-to-users sync
│       ├── brand-lab/            # Design token directions and brand showcase data
│       ├── owner/                # Owner-only read-only resource and operations DTOs
│       ├── security/             # IP rate limiting, action rate limiting
│       ├── supabase/             # Browser client, server client, service client
│       ├── audit.ts              # logAuditEvent — writes to audit_log, revalidates owner paths
│       ├── notifications.ts      # getUnreadCount, getNotifications, notifySubmitted, notifyReviewed
│       ├── notification-actions.ts  # Server actions for marking notifications read
│       └── site.ts               # getCanonicalSiteUrl — resolves production URL, strips localhost
├── supabase/
│   └── migrations/               # 14 ordered SQL migrations
├── tests/
│   ├── e2e/                      # 6 Playwright specs
│   └── unit/                     # 9 Vitest test files
├── scripts/
│   ├── setup-owner.ps1           # Owner bootstrap (PowerShell)
│   ├── seed-test-users.js        # Seed E2E test accounts
│   ├── seed.sql                  # SQL seed data
│   └── capture-feature-screenshots.mjs  # Screenshot capture utility
├── .github/workflows/test.yml    # CI pipeline
├── .env.example                  # Environment variable template
├── playwright.config.ts
└── vitest.config.ts
```

---

## Design Notes

- **No student accounts.** The public feed is fully unauthenticated — only staff and publishers log in.
- **Server Actions for all mutations.** Create, edit, publish, delete, review, and notification reads go through co-located `actions.ts` files with no separate API layer.
- **RLS on every table.** Admin and owner pages use a service-role client where RLS needs to be bypassed. The notifications table has its own RLS: users can only read and update their own rows.
- **Upload and link validation.** Banner URLs are restricted to local sample assets or the configured Supabase `banner-images` bucket; registration links must be valid `http` or `https` URLs.
- **View tracking via RPC.** `increment_announcement_view` runs as `SECURITY DEFINER` so anonymous users can increment counts without needing table-level write access.
- **Autosave.** The announcement form autosaves drafts continuously with a visual indicator.
- **Presentation layer.** Publishers control how their announcement renders on the public feed (font, size, urgency) — stored in the database, applied at render time.
- **Audit trail.** All significant actions are recorded in `audit_log` via `logAuditEvent()` and visible only to the owner. Owner dashboard paths are revalidated on every write.
- **Design system.** The public UI uses the Future Commons design system — a bento-grid feed layout, editorial stats panel, and token-based dark/light theming with INTI brand colors (INTI Red). All design tokens live in `globals.css`; never hardcoded in components.
- **Typography.** Three typefaces: Atkinson Hyperlegible (UI body), Bricolage Grotesque (display headings), Geist Mono (code/mono).
- **Theme.** Light/dark mode follows the OS preference (`prefers-color-scheme`), with a manual toggle available in every dashboard.
