# Codebase Structure

Bulletin keeps framework-owned files where Next.js expects them and groups shared code by purpose.

## Application

- `src/app` contains App Router routes, layouts, loading states, errors, and API routes.
- `src/app/(public)` contains the public bulletin feed and announcement detail routes.
- `src/app/(auth)` contains login routes.
- `src/app/(dashboard)`, `src/app/(admin)`, `src/app/(super-admin)`, and `src/app/(owner)` contain role-specific application areas.

## Shared UI

- `src/components/announcements` contains public announcement feed components.
- `src/components/dashboard` contains authenticated dashboard shell and dashboard UI.
- `src/components/layout` contains public layout pieces.
- `src/components/ui` contains low-level reusable UI primitives.

## Shared Logic

- `src/lib/supabase` contains Supabase clients.
- `src/lib/auth` contains authorization and role access logic.
- `src/lib/security` contains request and action rate-limiting helpers.
- `src/lib/announcements` contains announcement-specific helpers.
- `src/lib/data.ts`, `src/lib/types.ts`, and `src/lib/database.types.ts` contain shared data access and type definitions.

## Tests

- `tests/unit` contains Vitest unit and security tests.
- `tests/e2e` contains Playwright browser tests.
- `tests/e2e/helpers` contains Playwright-only helper utilities.

## Root

Root files are limited to project configuration, environment examples, CI, scripts, public assets, docs, and Supabase migrations.
