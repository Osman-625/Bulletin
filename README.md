# Bulletin

Bulletin is a campus announcement platform built for INTI-style public notices, publisher workflows, admin review, and owner-level operations. The public site presents announcements as a branded campus board, while authenticated areas handle drafting, review, publishing, user management, analytics, and maintenance.

The application is a Next.js App Router project backed by Supabase Auth, Postgres, Row Level Security, and Supabase Storage.

## Stack

| Area          | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| Framework     | Next.js 16.2.6 App Router, React 19.2.4, TypeScript               |
| Styling       | Tailwind CSS v4 plus custom CSS layers in `src/app/globals.css`   |
| Fonts         | Bricolage Grotesque, Atkinson Hyperlegible, Geist Mono            |
| Backend       | Supabase Auth, Postgres, RLS, Storage                             |
| Testing       | Vitest, Testing Library, Playwright                               |
| Observability | Sentry, Vercel Analytics, Vercel Speed Insights, optional PostHog |
| Deployment    | Vercel with a scheduled maintenance cron                          |

## Product Overview

Bulletin has two main surfaces:

1. Public board - a searchable, filterable announcement feed with campus-oriented visual sections, announcement detail pages, view tracking, SEO metadata, robots, and sitemap support.
2. Authenticated operations - role-based dashboards for publishers, admins, super admins, and owners.

The public board groups announcements into meaningful sections such as:

- New today
- Closing soon
- Plan ahead
- General notices

Sorting and date labels are computed in Malaysia time (`Asia/Kuala_Lumpur`) through `src/modules/announcements/public-board.ts`.

## Roles

Roles are enforced by Supabase data, server-side authorization helpers, and route protection in `src/proxy.ts`.

| Role          | Default area   | Main capabilities                                                                              |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `publisher`   | `/dashboard`   | Create drafts, upload banners, submit announcements for review, manage own announcements       |
| `admin`       | `/admin`       | Review scoped organization announcements, approve/reject submissions, manage scoped publishers |
| `super_admin` | `/super-admin` | Cross-organization administration, users, invitations, audit visibility                        |
| `owner`       | `/owner`       | Platform resources, owner-level controls, privileged user and system visibility                |

Users marked with `force_password_change` are redirected to `/change-password` before accessing protected areas.

## Main Features

### Public Announcement Board

- Server-rendered public feed at `/`
- Announcement detail pages for published, visible announcements
- Category filtering and full-text search
- Pagination with a fixed public page size
- Board sorting by priority, issue date, and closing date
- Featured/pinned announcement treatment
- Public view tracking through `increment_announcement_view`
- SEO through metadata, `robots.ts`, and `sitemap.ts`

### Publisher Workflow

- Draft creation and editing
- Autosave for existing drafts
- Banner image uploads to the `banner-images` Supabase Storage bucket
- Registration link validation
- Scheduled publish dates, expiry dates, pinned-until dates, and urgency
- Display controls for poster/card presentation
- Submit for admin review
- Delete, unpublish, and admin inline publish flows where authorized

### Admin Review

- Review queue for submitted announcements
- Scoped approval and rejection
- Required rejection comments
- Review records in `announcement_reviews`
- Author notifications for approvals, scheduled approvals, and rejections
- Audit log entries for important changes

### Owner Operations

The owner area reads operational data from Supabase and optional platform APIs:

- Announcement view totals and top announcements
- Published announcement counts and registration-link counts
- Password reset request counts
- Banner Storage usage and cleanup status
- Setup route status
- Vercel deployment status when Vercel API variables are configured
- Supabase project health and API usage when Supabase management variables are configured

### Notifications

`src/modules/notifications/` handles in-app notifications for:

- New submissions to admins, super admins, and owners
- Review approval, scheduled approval, and rejection messages to authors
- Unread counts and recent notification lists

### Security

- Supabase RLS is the primary data boundary
- Server actions re-check authorization before writes
- `src/proxy.ts` refreshes SSR sessions and redirects by role
- CSP nonce support is generated per request
- Security headers include HSTS, COOP, CORP, `X-Frame-Options`, `X-Content-Type-Options`, and strict referrer policy
- `/api/setup` is disabled unless explicitly enabled and is blocked on Vercel production
- `/api/maintenance/cleanup-orphan-banners` requires `Authorization: Bearer $CRON_SECRET`
- Persistent rate limiting is backed by `rate_limit_buckets`

## Repository Structure

```text
src/
  app/
    (public)/              Public board and announcement pages
    (auth)/                Login and password-change screens
    (dashboard)/           Publisher dashboard
    (admin)/               Admin review and management
    (super-admin)/         Super admin area
    (owner)/               Owner operations area
    api/
      maintenance/         Scheduled cleanup routes
      setup/               Owner bootstrap route
    globals.css            Tailwind v4 layers, tokens, public UI system
    layout.tsx             Root layout, metadata, analytics providers
  proxy.ts                 Session refresh, CSP, role redirects
  components/
    announcements/         Public announcement cards, category filter, registration links
    public/                Public board pieces: pagination, pinned notices, filters, empty state
    layout/                Header, footer, brand mark, theme toggle
    navigation/            Back navigation
    auth/                  Idle logout handler
    analytics/             Public feed analytics
    dashboard/             Announcement form, banner field, user management, dashboard shell
    account/               Account settings UI
  modules/                 Domain logic, one folder per feature
    announcements/         Feed, form, mutations, access, presentation, public board grouping and dates
    auth/                  Authorization helpers, roles, password policy, user sync
    categories/            Category display, validation, management
    invitations/           Invitation validation and created-invite handling
    notifications/         In-app notifications
    organizations/         Organization rules
    owner/                 Owner resource cards
    users/                 User actions, delete guard, display names, list links
    audit/                 Audit log helpers
  infrastructure/
    database/              Supabase clients (browser, server, admin), data access, generated types
    storage/               Banner Storage cleanup
  shared/
    middleware/            In-memory and persistent rate limiting
    errors/                Client and server error reporting
    constants/             Site URL and analytics events
    types/                 Shared database row types
    utils/                 Small helpers such as `cn`
supabase/
  migrations/              Database schema, RLS, roles, workflow, hardening
  seed-sample-announcements.sql   25 sample announcements covering every announcement type
tests/
  unit/                    Vitest unit tests, organised by domain
  e2e/                     Playwright E2E tests
public/
  sample-announcements/    Poster images used by the sample announcements
scripts/
  seed-test-users.js       Local/E2E user and fixture seed script
  setup-owner.ps1          Helper for calling the setup route
  audit_loop.sh / .ps1     Repeatable API security audit loop
docs/
  architecture/            Plans and specs
  brand/                   Future Commons design system notes
  operations/              Backup/rollback, readiness, and pre-deployment verification
```

## Database

The database is managed through ordered Supabase migrations in `supabase/migrations`.

Current migration set:

| Range                               | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `20260411000001` - `20260411000003` | Base schema, RLS, Storage bucket                                         |
| `20260418000004` - `20260418000007` | Schema fixes and RLS recursion fixes                                     |
| `20260502000008` - `20260503000010` | Post statuses, role system, owner role                                   |
| `20260507000011` - `20260508000014` | Auth sync, presentation fields, review workflow, password reset requests |
| `20260518000015` - `20260519000017` | Security and Storage policy hardening                                    |
| `20260521000018` - `20260521000020` | Owner user policy, rate limit buckets, parameterized audit search        |
| `20260603000021` - `20260606031448` | Profile sync ignores client-set roles; security advisor remediation      |
| `20260615000000`                    | Publisher revisions of rejected posts; view counter only via server      |
| `20260619000000` - `20260620000000` | Admin RLS scoped to the admin's assigned organizations                   |
| `20260627101049`                    | Storage policies drop redundant auth-role helper checks                  |
| `20261020000000`                    | Only the server may change `users.force_password_change`                 |

Important tables include:

- `users`
- `organizations`
- `organization_members`
- `categories`
- `announcements`
- `announcement_reviews`
- `notifications`
- `invitations`
- `password_reset_requests`
- `audit_log`
- `rate_limit_buckets`

The `banner-images` Storage bucket stores announcement banner uploads.

## Environment Variables

Start from the checked-in example:

```bash
cp .env.example .env.local
```

Required for normal app operation:

| Variable                        | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anon key                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only privileged Supabase key                     |
| `NEXT_PUBLIC_APP_URL`           | Canonical app URL used for metadata, sitemap, and links |

Required for scheduled maintenance:

| Variable                     | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `CRON_SECRET`                | Bearer token for maintenance routes    |
| `BANNER_CLEANUP_MAX_DELETES` | Optional delete cap for banner cleanup |

Required only when bootstrapping an owner:

| Variable                    | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `ENABLE_SETUP_ROUTE`        | Must be `1` to enable `/api/setup` outside Vercel production |
| `SETUP_SECRET`              | Required `x-setup-secret` header value                       |
| `SETUP_OWNER_EMAIL`         | Owner email to create or promote                             |
| `SETUP_OWNER_USERNAME`      | Owner username                                               |
| `SETUP_OWNER_TEMP_PASSWORD` | Initial owner password, minimum 12 characters                |

Optional observability:

| Variable                             | Purpose                                |
| ------------------------------------ | -------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`             | Client/server Sentry reporting         |
| `SENTRY_AUTH_TOKEN`                  | Sentry release upload during builds    |
| `SENTRY_ORG`                         | Sentry organization                    |
| `SENTRY_PROJECT`                     | Sentry project                         |
| `NEXT_PUBLIC_POSTHOG_TOKEN`          | Product analytics token                |
| `NEXT_PUBLIC_POSTHOG_HOST`           | PostHog host                           |
| `NEXT_PUBLIC_POSTHOG_SESSION_REPLAY` | Enables PostHog replay when set to `1` |

Optional owner resource integrations:

| Variable                | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `VERCEL_API_TOKEN`      | Reads latest Vercel production deployment |
| `VERCEL_PROJECT_ID`     | Vercel project id                         |
| `VERCEL_TEAM_ID`        | Optional Vercel team id                   |
| `SUPABASE_ACCESS_TOKEN` | Reads Supabase management API data        |
| `SUPABASE_PROJECT_REF`  | Optional Supabase project ref override    |

Testing variables are documented in `.env.example` and can be generated for local E2E runs with `scripts/seed-test-users.js`.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`, then fill in Supabase credentials.

Apply Supabase migrations to your project. The repository expects the migrations in `supabase/migrations` to be applied in filename order.

Start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Owner Bootstrap

Use `/api/setup` only to create the first owner account in a controlled environment.

Important behavior:

- The route only accepts `POST`
- `ENABLE_SETUP_ROUTE=1` is required
- `x-setup-secret` must match `SETUP_SECRET`
- The route is intentionally unavailable on Vercel production
- The temporary password comes from `SETUP_OWNER_TEMP_PASSWORD`
- The response does not return the temporary password
- If an owner already exists, the route returns `409`

Example request:

```bash
curl -X POST http://localhost:3000/api/setup \
  -H "x-setup-secret: $SETUP_SECRET"
```

After the owner signs in, disable the setup route and rotate any temporary credentials that were used.

## Scripts

| Command                | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start Next.js development server              |
| `npm run build`        | Build the production app                      |
| `npm run start`        | Start a built production app                  |
| `npm run lint`         | Run ESLint                                    |
| `npm run format`       | Format the repository with Prettier           |
| `npm run format:check` | Check Prettier formatting                     |
| `npm test`             | Run Vitest unit tests                         |
| `npm run test:watch`   | Run Vitest in watch mode                      |
| `npm run test:e2e`     | Run Playwright E2E tests                      |
| `npm run test:smoke`   | Run smoke tests against `PLAYWRIGHT_BASE_URL` |
| `npm run test:e2e:ui`  | Open the Playwright UI runner                 |
| `npm run doctor`       | Scan React code with React Doctor             |
| `npm run fallow`       | Find dead code and duplication with Fallow    |

## Testing

Run unit tests:

```bash
npm test
```

Run E2E tests locally:

```bash
node scripts/seed-test-users.js
npm run test:e2e
```

The seed script creates or resets test users, writes `.env.test.local`, and adds sample data needed by the Playwright suite. It requires a valid local `.env.local` with Supabase URL and service role key.

Playwright defaults to `http://localhost:3000` and starts `npm run dev` automatically unless an existing server is reused. Set `PLAYWRIGHT_BASE_URL` to target another environment.

### Sample announcements

`supabase/seed-sample-announcements.sql` adds 25 sample announcements for demos and visual checks. Paste it into the Supabase SQL editor and run it; it creates no login and posts as an existing publisher (or the owner) in an approved organization.

- Covers every urgency, display font, and display size combination, all announcement categories that exist, and every lifecycle state (live, scheduled, draft, submitted, rejected, expired, archived)
- Ten of the live announcements carry illustrated posters from `public/sample-announcements/`
- Safe to re-run: ids are fixed and every date is relative to `now()`, so a re-run moves the dates forward
- Remove the samples with the `DELETE` statement at the bottom of the file

Run deployed smoke tests:

```bash
PLAYWRIGHT_BASE_URL=https://your-deployment.example npm run test:smoke
```

## CI and Automation

GitHub Actions currently cover:

- Lint, type check, production build, Vitest, and Playwright E2E
- Optional Supabase generated type drift checks
- Supabase migration dry-runs and manually approved applies
- Weekly or manual OWASP ZAP baseline scans
- React Doctor scans on pull requests (new issues only) and on pushes to `main` (score trend)
- Daily database backup

A Husky pre-commit hook runs `lint-staged` (ESLint with zero warnings plus Prettier on staged files).

Vercel cron is configured in `vercel.json`:

```json
{
  "path": "/api/maintenance/cleanup-orphan-banners",
  "schedule": "17 18 * * *"
}
```

That route scans `banner-images`, compares files with referenced announcement banner URLs, and deletes orphaned files up to the configured cap.

## Deployment Notes

For Vercel deployment:

1. Configure the Supabase environment variables.
2. Configure `NEXT_PUBLIC_APP_URL` to the production URL.
3. Add `CRON_SECRET` before enabling the maintenance cron.
4. Add Sentry/PostHog variables only when those services are ready.
5. Add Vercel and Supabase management tokens only if owner resource cards should show live platform status.
6. Keep `ENABLE_SETUP_ROUTE` disabled in production.

The Next image configuration derives the Supabase image host from `NEXT_PUBLIC_SUPABASE_URL`, so that variable must be correct before building.

## Design System

The visual direction is documented in `docs/brand/bulletin-design-system.md`.

The public UI uses the "Future Commons" system:

- Warm campus canvas
- INTI red accent
- Editorial card hierarchy
- Bento-style public board structure
- Branded poster and announcement card treatments
- Intentional light/dark theme tokens

Global tokens and animation primitives live in `src/app/globals.css`. Public-facing components live under `src/components/announcements/` and `src/components/layout/`.

## Operational Notes

- Do not bypass server actions for protected writes; they contain authorization and audit behavior.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client components.
- Use the generated `src/infrastructure/database/database.types.ts` types when adding database-facing code.
- Keep announcement date logic centralized in `src/modules/announcements/public-board.ts`.
- Run `npm run fallow` and `npm run doctor` before large cleanups; both are configured in `.fallowrc.json` and `doctor.config.json`.
- Banner cleanup should be tested with `?dryRun=1` before deleting in a new environment.
- Public announcement images depend on the `banner-images` bucket policies and Next remote image configuration.

## Troubleshooting

| Symptom                         | Likely cause                                                        |
| ------------------------------- | ------------------------------------------------------------------- |
| `/api/setup` returns `404`      | Setup route is disabled, or the app is running on Vercel production |
| `/api/setup` returns `403`      | Missing or incorrect `x-setup-secret`                               |
| `/api/setup` returns `409`      | An owner already exists                                             |
| `/api/setup` returns `412`      | Required owner bootstrap env vars are missing or invalid            |
| Public images do not load       | `NEXT_PUBLIC_SUPABASE_URL` or Storage policies are incorrect        |
| E2E login tests fail            | Test users were not seeded or `.env.test.local` is stale            |
| Maintenance route returns `401` | Missing or incorrect `Authorization: Bearer $CRON_SECRET`           |

## Current Verification

The repository has automated coverage across unit tests, server action behavior, setup route behavior, role-aware flows, public UI behavior, and E2E browser flows. Before merging production changes, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test
npm run test:e2e
```
