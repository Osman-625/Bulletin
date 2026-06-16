## Commands

```bash
npm run dev                                      # dev server (localhost:3000)
npm run build                                    # production build
npm test                                         # vitest unit suite (config/vitest.config.ts)
npm run test:watch                               # vitest watch mode
npm run test:e2e                                 # playwright E2E (config/playwright.config.ts)
npm run test:smoke                               # smoke tests against PLAYWRIGHT_BASE_URL
npm run lint                                     # eslint
npm run format                                   # prettier --write .
npx tsc --noEmit                                 # type check
```

@AGENTS.md

## Project Identity

Bulletin is a campus announcement platform for INTI International University. Live at `https://bulletininti.vercel.app/`. GitHub: `https://github.com/Osman6202/Bulletin`.

Stack: Next.js 16.2.6 App Router · React 19 · TypeScript · Tailwind CSS v4 · Supabase Auth/Postgres/RLS/Storage · Vercel.

## Design System — Future Commons

Visual direction: **warm, official, alive**. Editorial campus board aesthetic. Never SaaS, never social media.

- **Canvas:** `#F8F2DF` (light) / `#15110f` (dark)
- **Accent:** INTI Red `#C8102E` / hover `#A80D24`
- **Support:** Navy `#143A5F`, Gold `#D4941F`
- **Fonts:** Bricolage Grotesque (display) · Atkinson Hyperlegible (body) · Geist Mono (metadata/code)
- **Tokens:** All colors via CSS custom properties in `src/app/globals.css`. Never hard-code hex values in components.
- Design brief: `.impeccable.md` (root). Full system: `docs/brand/bulletin-design-system.md`.

## Architecture

```
src/
  proxy.ts                    Session refresh, CSP nonce, role-based redirects — the auth gateway
  app/
    (public)/                 Public announcement board — no auth required
    (auth)/                   Login, forgot-password
    (dashboard)/              Publisher workspace
    (admin)/                  Admin review
    (super-admin)/            Cross-org administration
    (owner)/                  Platform owner controls
    api/maintenance/          Cron: orphan banner cleanup
    api/setup/                Bootstrap route (disabled in prod)
    globals.css               Tailwind v4 layers + ALL design tokens
  components/
    announcements/            Public cards, category filter, registration links
    layout/                   Header, Footer, BrandMark, ThemeToggle
    navigation/               BackNavButton
    auth/                     IdleLogout
    analytics/                PublicFeedAnalytics
    dashboard/                AnnouncementForm, DashboardShell, DashboardSidebar, etc.
    account/                  AccountSettingsPage
  lib/
    announcements/            Feed grouping, form actions, markdown, presentation, public-board, URLs
    auth/                     authz.ts (authorization helpers), sync-users.ts
    security/                 rate-limit.ts, persistent-rate-limit.ts, action-rate-limit.ts
    supabase/                 client.ts, server.ts, admin.ts
    database.types.ts         Generated Supabase types — do not edit manually
    data.ts                   Main data access layer
    notifications.ts          In-app notification helpers
tests/
  unit/                       Vitest — organized by domain (auth/, announcements/, security/, etc.)
  e2e/                        Playwright specs
config/
  vitest.config.ts
  playwright.config.ts
  playwright.smoke.config.ts
supabase/migrations/          20 ordered migrations — apply in filename order
docs/
  brand/                      Design system and brand directions
  architecture/               Plans and specs
```

## Roles

| Role          | Route          | Can do                                        |
| ------------- | -------------- | --------------------------------------------- |
| `publisher`   | `/dashboard`   | Draft, upload banners, submit for review      |
| `admin`       | `/admin`       | Review, approve/reject scoped org submissions |
| `super_admin` | `/super-admin` | Cross-org admin, users, invitations           |
| `owner`       | `/owner`       | Platform controls, privileged visibility      |

Role enforcement: Supabase RLS (data boundary) + `src/proxy.ts` (route redirects) + server actions (re-check before writes).

## Key Rules

- Read `node_modules/next/dist/docs/` before using any Next.js API — this is Next 16, not the version from training data.
- All DB types come from `src/lib/database.types.ts` — regenerate with Supabase CLI after schema changes, never hand-edit.
- Server actions re-authorize before every write. Never bypass.
- Rate limiting uses `src/lib/security/` — apply to all public-facing mutation routes.
- CSP nonce is generated in `src/proxy.ts` — any new `<script>` tags must use `nonce`.
- Banner images go to Supabase Storage `banner-images` bucket only. Cleanup runs via cron at `/api/maintenance/cleanup-orphan-banners`.
- Date/time logic for announcements: always use `Asia/Kuala_Lumpur` timezone, centralized in `src/lib/announcements/public-board.ts`.
- When auditing or fixing UI, follow `.claude/rules/ux-research-quality.md` — verify from evidence, fix root causes not symptoms, preserve the 3-column board and data behavior, and report every bug with file/cause/visible failure/exact fix/test step.

## graphify

Knowledge graph at `graphify-out/` (cache only — run `graphify update .` after modifying source files to regenerate).

Rules:

- Before answering architecture questions, check `graphify-out/GRAPH_REPORT.md` if it exists.
- After modifying code files in this session, run `graphify update .` (AST-only, no API cost).
