# Bulletin

A governed announcement platform for INTI International University. Public-facing feed with a five-tier role system, editorial presentation controls, in-app notifications, view tracking, and a full audit trail.

**Stack:** Next.js 16.2.3 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + RLS + Auth + Storage) · Vercel

---

## Role System

Five tiers, each with a dedicated route group and dashboard:

| Role | Who | Can do |
|------|-----|--------|
| **Public** | Anyone | Browse the feed, read announcements — no login required |
| **Publisher** | Clubs, departments, societies | Create drafts, submit for review, manage own announcements, receive review notifications |
| **Admin** | SA Director, Student Council President | Approve/reject submissions, manage publishers, orgs, categories, users — notified on new submissions |
| **Super Admin** | Platform administrators | Manage admins, global categories, platform analytics, password resets |
| **Owner** | Platform owner (Maaney) | Full audit log, all metrics, all user management — bypasses RLS |

Login automatically routes each role to its panel.

---

## Features

### Public feed
- Announcement grid with featured first-card layout
- Category filter via URL search params
- Markdown-stripped excerpts on cards
- Full detail view with optional registration link
- View count tracked per announcement (via RPC — safe for unauthenticated users)
- Back navigation on detail pages
- Pinned announcements surfaced above the fold (until `pinned_until` expires)
- Scheduled posts hidden until their publish time

### Publisher dashboard
- Create and edit announcements with rich presentation controls:
  - **Urgency** — `normal` · `important` · `urgent`
  - **Display font** — `editorial` · `clean`
  - **Display size** — `compact` · `standard` · `large`
- Banner image upload to Supabase Storage
- Draft autosave with visual indicator
- Schedule a future publish time (`scheduled_publish_at`)
- Edit rejected announcements and resubmit
- Status tracking across full lifecycle
- In-app notifications: approval, rejection (with comment), scheduled publish confirmation

### Admin panel
- Review queue — approve or reject submitted announcements
- Rejection comments sent to publisher as a notification
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
- User password resets
- In-app notifications

### Owner panel
- Bento dashboard: user role breakdown chart, publish-rate donut, pending review count, recent audit feed
- Full paginated audit log (50 per page, newest first)
- All-user management
- Owner-level analytics
- In-app notifications

### Notifications
In-app notification system covering the full review workflow:

| Event | Who is notified |
|-------|----------------|
| Publisher submits announcement | All admins, super admins, and owner |
| Admin approves announcement | Publisher (with scheduled time if applicable) |
| Admin rejects announcement | Publisher (with rejection comment) |

Notifications are per-user, have unread state, and link directly to the relevant page. Delivered via the `NotificationsPanel` component available in all role dashboards.

### Security
- IP-based rate limiting on all public routes
- Server action rate limiting
- Row-level security on all database tables
- Service-role client for owner/admin queries that bypass RLS
- One-time bootstrap endpoint (`/api/setup`) protected by `SETUP_SECRET`
- Idle logout on all authenticated sessions

---

## Announcement Lifecycle

```
Draft → Submitted → Published → Expired (auto at 30 days) → Archived
                ↓
            Rejected → (publisher edits) → Submitted
```

Publishers save drafts and submit for admin review. Admins approve or reject (with an optional comment). Rejected announcements can be revised and resubmitted. Published announcements auto-expire after 30 days.

**Scheduled publishing:** Approved announcements with a `scheduled_publish_at` in the future are not visible on the public feed until that time passes. The RLS policy and the public query both enforce this.

**Pinned posts:** Announcements with an active `pinned_until` timestamp are surfaced above the normal grid. Pinning expires automatically.

---

## Audit Log

Every significant system action writes a row to `audit_log`:

| Field | Description |
|-------|-------------|
| `actor_id` | User who performed the action (with display name + role) |
| `action` | What was done (e.g. `approve_announcement`, `invite_publisher`) |
| `target_type` | What was acted on (e.g. `announcement`, `user`) |
| `target_id` | ID of the affected record |
| `metadata` | Additional context as JSON |
| `created_at` | Timestamp |

The owner dashboard shows the 6 most recent entries. `/owner/audit` shows the full paginated log. Only the owner can read this table — append-only, no editing. Owner dashboard paths are revalidated automatically after each write.

---

## Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Announcement feed with category filter, pinned posts, scheduled post enforcement |
| `/announcements/[id]` | Full announcement detail (increments view count) |

### Auth
| Route | Description |
|-------|-------------|
| `/login` | Email/username + password (routes to role dashboard on success) |
| `/change-password` | Forced password change flow |
| `/register` | Account registration |

### Publisher — `/dashboard`
| Route | Description |
|-------|-------------|
| `/dashboard` | Overview stats and quick actions |
| `/dashboard/announcements` | All announcements with status badges |
| `/dashboard/announcements/new` | Create announcement (with scheduled publish option) |
| `/dashboard/announcements/[id]/edit` | Edit announcement (available on draft, submitted, rejected) |
| `/dashboard/notifications` | In-app notification inbox |

### Admin — `/admin`
| Route | Description |
|-------|-------------|
| `/admin` | Overview with pending count and quick links |
| `/admin/review` | Pending review queue |
| `/admin/review/[id]` | Review detail — approve (with optional schedule) or reject (with comment) |
| `/admin/publishers` | Publisher list |
| `/admin/publishers/invite` | Invite new publisher (with copyable link) |
| `/admin/orgs` | Organization list |
| `/admin/orgs/new` | Create organization |
| `/admin/categories` | Category management |
| `/admin/users` | User management |
| `/admin/analytics` | Admin analytics |
| `/admin/notifications` | In-app notification inbox |

### Super Admin — `/super-admin`
| Route | Description |
|-------|-------------|
| `/super-admin` | Platform overview |
| `/super-admin/admins` | Admin list |
| `/super-admin/admins/invite` | Invite new admin |
| `/super-admin/categories` | Global category management |
| `/super-admin/users` | All users with password reset |
| `/super-admin/analytics` | Platform analytics |
| `/super-admin/notifications` | In-app notification inbox |

### Owner — `/owner`
| Route | Description |
|-------|-------------|
| `/owner` | Bento dashboard: role breakdown, publish rate, audit feed |
| `/owner/users` | All users |
| `/owner/analytics` | Owner analytics |
| `/owner/audit` | Full audit log (paginated, 50/page) |
| `/owner/notifications` | In-app notification inbox |

### API
| Route | Description |
|-------|-------------|
| `/api/setup` | One-time owner bootstrap — **delete after first run** |

---

## Database

13 migrations. Run them in order from `supabase/migrations/` in the Supabase SQL editor.

| File | Description |
|------|-------------|
| `000001_schema` | Core tables: users, organizations, organization_members, categories, announcements |
| `000002_rls` | Row-level security policies for all tables |
| `000003_storage` | `banner-images` bucket + storage RLS |
| `000004–007` | RLS recursion fixes for org_members (Supabase gotcha) |
| `000008_post_status_enums` | Announcement status enum |
| `000009_role_system` | User role enum and RBAC policies |
| `000010_owner_role` | Owner role schema |
| `000011_sync_auth_users` | Trigger: sync `auth.users` → `public.users` |
| `000012_announcement_presentation` | `urgency`, `display_font`, `display_size` columns |
| `000013_announcement_workflow` | `scheduled_publish_at`, `pinned_until`, `view_count` + `notifications` table + `increment_announcement_view` RPC |

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
SETUP_SECRET=choose-a-strong-secret
```

### 3. Run migrations

In the Supabase SQL editor, paste and run each file from `supabase/migrations/` in filename order (all 13).

### 4. Bootstrap the owner account

```powershell
# PowerShell
./scripts/setup-owner.ps1
```

Or with curl:

```bash
curl -X POST http://localhost:3000/api/setup \
  -H "x-setup-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"strongpassword"}'
```

> Delete or disable `/api/setup` after the owner account is created.

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

5 test files: authz, feed queries, rate limiting, setup route security, presentation constants.

### E2E tests (Playwright)

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode
```

5 spec files: auth, feed, routing, setup-route, users.
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

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier (check only) |
| `npm test` | Unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | E2E tests |
| `npm run test:e2e:ui` | E2E tests with Playwright UI |

---

## Project Structure

```
Bulletin/
├── src/
│   ├── app/
│   │   ├── (public)/             # Feed, announcement detail (+ ViewTracker, view actions)
│   │   ├── (auth)/               # Login, register, change-password
│   │   ├── (dashboard)/          # Publisher dashboard + notifications
│   │   ├── (admin)/              # Admin panel + notifications
│   │   ├── (super-admin)/        # Super admin panel + notifications
│   │   ├── (owner)/              # Owner panel + notifications
│   │   ├── api/setup/            # One-time bootstrap endpoint
│   │   └── layout.tsx            # Root layout (Libre Franklin + Newsreader + Geist Mono)
│   ├── components/
│   │   ├── announcements/        # AnnouncementCard, CategoryFilter, BackButton
│   │   ├── auth/                 # IdleLogout
│   │   ├── dashboard/            # AnnouncementForm, AnnouncementRow, DashboardShell,
│   │   │                         # DashboardSidebar, DashboardTopNav, StatusBadge,
│   │   │                         # GlassCard, AutosaveIndicator, CountUp, ActionBar,
│   │   │                         # NotificationsPanel
│   │   ├── layout/               # Header, ThemeToggle
│   │   └── ui/                   # Button (base-ui + CVA, 6 variants)
│   └── lib/
│       ├── announcements/        # Feed queries, access control, presentation constants, form helpers
│       ├── auth/                 # Authorization, auth-to-users sync
│       ├── security/             # IP rate limiting, action rate limiting
│       ├── supabase/             # Browser client, server client, service client
│       ├── audit.ts              # logAuditEvent — writes to audit_log, revalidates owner paths
│       ├── notifications.ts      # getUnreadCount, getNotifications, notifySubmitted, notifyReviewed
│       └── notification-actions.ts  # Server actions for marking notifications read
├── supabase/
│   └── migrations/               # 13 ordered SQL migrations
├── tests/
│   ├── e2e/                      # 5 Playwright specs
│   └── unit/                     # 5 Vitest tests
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
- **View tracking via RPC.** `increment_announcement_view` runs as `SECURITY DEFINER` so anonymous users can increment counts without needing table-level write access.
- **Autosave.** The announcement form autosaves drafts continuously with a visual indicator.
- **Presentation layer.** Publishers control how their announcement renders on the public feed (font, size, urgency) — stored in the database, applied at render time.
- **Audit trail.** All significant actions are recorded in `audit_log` via `logAuditEvent()` and visible only to the owner. Owner dashboard paths are revalidated on every write.
- **Typography.** Three typefaces: Libre Franklin (UI), Newsreader (editorial/serif headings), Geist Mono (code/mono).
