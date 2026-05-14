# Bulletin Production Readiness Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Bulletin from a promising live demo to a production-ready INTI announcement platform with passing build, green CI, hardened security, credible live content, and measurable launch gates.

**Architecture:** Work in gates. Gate 0 restores deployability and CI trust. Gate 1 fixes public trust issues on the live experience. Gate 2 hardens security and scale risks. Gate 3 adds operational polish and launch governance.

**Tech Stack:** Next.js 16.2.x App Router, React 19, TypeScript, Tailwind CSS v4, Supabase Auth/Postgres/RLS/Storage, Vercel, GitHub Actions, Vitest, Playwright.

---

## Execution Rules

- Do not start implementation until the user gives explicit approval.
- Keep each task independently shippable and verified.
- Read installed Next.js docs before any Next 16 proxy, metadata, or file-convention change.
- Preserve user work. Do not reset or revert unrelated changes.
- After every implementation gate, run the exact verification commands listed in that gate.

## Source Evidence

- Live app: `https://bulletininti.vercel.app/`
- GitHub repo: `https://github.com/Osman6202/Bulletin`
- Notion report: `Production Readiness Report - May 13, 2026`
- Current local blocker: `npm run build` fails because both `src/middleware.ts` and `src/proxy.ts` exist.
- Current CI blocker: `.github/workflows/test.yml` does not run `npm run build`, and recent `main` e2e failed with blank Supabase test secrets.
- Current audit blocker: `npm audit --omit=dev` reports high-severity Next.js advisories for `next@16.2.3`.

---

## File Map

### Build and Next.js 16 Proxy

- Delete: `src/middleware.ts`
- Keep: `src/proxy.ts`
- Reference: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`

### CI/CD

- Modify: `.github/workflows/test.yml`
- Optional create: `.github/workflows/audit.yml` if security scanning is split from tests
- Reference: `playwright.config.ts`

### Dependency Hardening

- Modify: `package.json`
- Modify: `package-lock.json`
- Verify: `npm audit --omit=dev`

### Public Content and Markdown

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/(public)/announcements/[id]/page.tsx`
- Modify: `src/components/announcements/AnnouncementCard.tsx`
- Modify or seed: `supabase/seed.sql`, `scripts/seed.sql`

### SEO and Metadata

- Modify: `src/app/layout.tsx`
- Modify: `src/app/(public)/announcements/[id]/page.tsx`
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Optional create: `src/lib/seo.ts`

### Security Headers

- Modify: `next.config.ts`

### Rate Limiting

- Modify: `src/lib/security/rate-limit.ts`
- Modify: `src/lib/security/action-rate-limit.ts`
- Modify: `src/app/api/setup/route.ts`
- Optional create: `supabase/migrations/20260514000015_rate_limits.sql`
- Test: `tests/unit/rate-limit.test.ts`

### Public Performance and Caching

- Modify: `src/components/layout/Header.tsx`
- Optional create: `src/components/layout/PublicAuthLink.tsx`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/lib/data.ts`
- Optional create: `src/lib/announcements/pagination.ts`
- Test: `tests/unit/feed.test.ts`
- Test: `tests/e2e/feed.spec.ts`

### Upload Ownership and Cleanup

- Modify: `src/components/dashboard/AnnouncementForm.tsx`
- Modify: `src/lib/announcements/form.ts`
- Modify: `supabase/migrations/20260411000003_storage.sql`
- Optional create: `supabase/migrations/20260514000016_banner_storage_policy.sql`
- Test: `tests/unit/announcement-form.test.ts`

### Observability and Accessibility

- Modify: `src/app/(public)/error.tsx`
- Modify: `src/app/(dashboard)/error.tsx`
- Modify: `src/app/(auth)/error.tsx`
- Optional create: `src/lib/observability.ts`
- Optional create: `tests/e2e/accessibility.spec.ts`

---

## Gate 0: Restore Deployability

### Task 1: Remove duplicate middleware convention

**Files:**
- Delete: `src/middleware.ts`
- Verify: `src/proxy.ts`

- [ ] **Step 1: Read Next 16 proxy docs**

Run:

```powershell
Get-Content -Raw -LiteralPath node_modules\next\dist\docs\01-app\01-getting-started\16-proxy.md
```

Expected: docs confirm Next.js 16 uses `proxy.ts` and supports only one proxy file.

- [ ] **Step 2: Delete the compatibility middleware file**

Delete `src/middleware.ts`. Keep all logic in `src/proxy.ts`.

- [ ] **Step 3: Verify the build**

Run:

```powershell
npm run build
```

Expected: build no longer fails with `Both middleware file ... and proxy file ... are detected`.

- [ ] **Step 4: Run fast checks**

Run:

```powershell
npm run lint
npx tsc --noEmit
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```powershell
git add src/middleware.ts src/proxy.ts
git commit -m "fix: use Next proxy convention only"
```

### Task 2: Add build to CI and fail fast on missing test secrets

**Files:**
- Modify: `.github/workflows/test.yml`

- [ ] **Step 1: Add an env validation step before Playwright**

Add this before `npm run test:e2e`:

```yaml
      - name: Validate e2e environment
        run: |
          test -n "$NEXT_PUBLIC_SUPABASE_URL"
          test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
          test -n "$SUPABASE_SERVICE_ROLE_KEY"
          test -n "$TEST_OWNER_EMAIL"
          test -n "$TEST_OWNER_PASSWORD"
          test -n "$TEST_SUPER_ADMIN_EMAIL"
          test -n "$TEST_SUPER_ADMIN_PASSWORD"
          test -n "$TEST_ADMIN_EMAIL"
          test -n "$TEST_ADMIN_PASSWORD"
          test -n "$TEST_PUBLISHER_EMAIL"
          test -n "$TEST_PUBLISHER_PASSWORD"
          test -n "$TEST_FORCE_CHANGE_EMAIL"
          test -n "$TEST_FORCE_CHANGE_PASSWORD"
```

- [ ] **Step 2: Add production build to CI**

Add this after `npm test` and before Playwright install:

```yaml
      - run: npm run build
```

- [ ] **Step 3: Verify workflow syntax locally by inspection**

Run:

```powershell
Get-Content -Raw -LiteralPath .github\workflows\test.yml
```

Expected: order is `npm ci`, lint, typecheck, unit, build, Playwright install, e2e.

- [ ] **Step 4: Commit**

```powershell
git add .github/workflows/test.yml
git commit -m "ci: gate deployments on build and e2e env"
```

### Task 3: Patch high-severity Next.js audit finding

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Check current advisories**

Run:

```powershell
npm audit --omit=dev
```

Expected before fix: high-severity advisory includes `next`.

- [ ] **Step 2: Upgrade Next within major version**

Run:

```powershell
npm install next@16.2.6 eslint-config-next@16.2.6
```

If npm reports a newer patched stable 16.x, use that exact stable version instead of a canary.

- [ ] **Step 3: Verify all core checks**

Run:

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --omit=dev
```

Expected: lint, typecheck, tests, and build pass. Audit has no high severity production dependency findings.

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore: upgrade Next to patched release"
```

---

## Gate 1: Fix Public Trust

### Task 4: Replace demo/stale live content and seed categories

**Files:**
- Modify: `supabase/seed.sql`
- Modify: `scripts/seed.sql`
- Optional modify: README seed instructions

- [ ] **Step 1: Define active categories**

Use these launch categories:

```text
Academic
Student Affairs
Career
Events
Clubs
Facilities
Exams
```

- [ ] **Step 2: Update seed data**

Update seed SQL so categories are active and live announcements use 2026 dates only.

- [ ] **Step 3: Verify public UI no longer shows `0 Topics`**

Run local app and inspect `/`.

Expected: stats show at least 7 topics, and category filter buttons render beyond `All`.

- [ ] **Step 4: Commit**

```powershell
git add supabase/seed.sql scripts/seed.sql README.md
git commit -m "chore: refresh launch seed content"
```

### Task 5: Add GitHub-flavored markdown support

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/(public)/announcements/[id]/page.tsx`
- Test: add or update `tests/unit/presentation.test.ts`

- [ ] **Step 1: Install markdown plugins**

Run:

```powershell
npm install remark-gfm rehype-sanitize
```

- [ ] **Step 2: Update `ReactMarkdown`**

In `src/app/(public)/announcements/[id]/page.tsx`, import:

```ts
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
```

Then render:

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
  components={{
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto">
        <table className="w-full border-collapse text-left text-base">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-[var(--color-border)] px-3 py-2 font-semibold text-[var(--color-text-primary)]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[var(--color-border)] px-3 py-2">{children}</td>
    ),
  }}
>
  {body ?? ''}
</ReactMarkdown>
```

Preserve existing heading, paragraph, list, and strong component overrides when applying this.

- [ ] **Step 3: Verify live-style table rendering**

Use an announcement body with:

```markdown
| Day | Hours |
| --- | --- |
| Monday - Friday | 7:30 am - 12:00 midnight |
```

Expected: page renders an HTML table, not raw pipe characters.

- [ ] **Step 4: Run checks**

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json src/app/(public)/announcements/[id]/page.tsx tests/unit/presentation.test.ts
git commit -m "feat: support safe announcement markdown tables"
```

### Task 6: Add public SEO, robots, sitemap, and social previews

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(public)/announcements/[id]/page.tsx`
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Add site metadata**

Update root metadata with:

```ts
metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://bulletininti.vercel.app'),
openGraph: {
  type: 'website',
  siteName: 'Bulletin',
  title: 'Bulletin - INTI International University',
  description: 'Official campus announcements for INTI International University.',
},
twitter: {
  card: 'summary_large_image',
  title: 'Bulletin - INTI International University',
  description: 'Official campus announcements for INTI International University.',
},
```

- [ ] **Step 2: Add announcement metadata**

In `generateMetadata()` for announcement detail pages, return title, description, and Open Graph fields derived from announcement title/body/banner.

- [ ] **Step 3: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bulletininti.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/owner', '/super-admin', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 4: Create `src/app/sitemap.ts`**

Use `getPublicAnnouncements()` to include `/` plus live announcement URLs.

- [ ] **Step 5: Verify**

Run:

```powershell
npm run build
```

Expected: build passes and local `/robots.txt` and `/sitemap.xml` return 200.

- [ ] **Step 6: Commit**

```powershell
git add src/app/layout.tsx src/app/(public)/announcements/[id]/page.tsx src/app/robots.ts src/app/sitemap.ts
git commit -m "feat: add public SEO and discovery metadata"
```

---

## Gate 2: Hardening and Scale

### Task 7: Add production security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Disable powered-by header and add headers**

Add `poweredByHeader: false` and a `headers()` function with:

```ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ]
}
```

Add CSP after validating Supabase, Vercel, image, and font requirements in a browser.

- [ ] **Step 2: Verify headers locally or on preview**

Run:

```powershell
npm run build
```

Then verify with browser or `Invoke-WebRequest` against the preview deployment.

- [ ] **Step 3: Commit**

```powershell
git add next.config.ts
git commit -m "feat: add baseline security headers"
```

### Task 8: Replace in-memory rate limit with durable limiter

**Files:**
- Modify: `src/lib/security/rate-limit.ts`
- Modify: `src/lib/security/action-rate-limit.ts`
- Modify: `src/app/api/setup/route.ts`
- Test: `tests/unit/rate-limit.test.ts`

- [ ] **Step 1: Choose storage**

Use Supabase Postgres unless a Redis/KV service is approved. Create a `rate_limits` table with key, count, and reset timestamp.

- [ ] **Step 2: Add migration**

Create `supabase/migrations/20260514000015_rate_limits.sql` with table, indexes, RLS disabled for direct public access, and an RPC for atomic increment/check.

- [ ] **Step 3: Update rate-limit implementation**

`checkActionRateLimit()` should call the durable RPC in production. Keep the in-memory function only for unit tests and local fallback.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/unit/rate-limit.test.ts
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/lib/security/rate-limit.ts src/lib/security/action-rate-limit.ts src/app/api/setup/route.ts tests/unit/rate-limit.test.ts supabase/migrations/20260514000015_rate_limits.sql
git commit -m "feat: persist production rate limits"
```

### Task 9: Make public feed cacheable and paginated

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Create: `src/components/layout/PublicAuthLink.tsx`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/lib/data.ts`
- Test: `tests/unit/feed.test.ts`
- Test: `tests/e2e/feed.spec.ts`

- [ ] **Step 1: Split public auth state from header**

Keep static logo/nav in `Header.tsx`. Move session-aware `Workspace` vs `Sign in` behavior into a small component that does not force the whole feed into `no-store`.

- [ ] **Step 2: Add pagination to public data query**

Support `limit`, `cursorPublishedAt`, and `cursorId`. Default limit: 20.

- [ ] **Step 3: Add feed UI**

Render first page plus a `Load more` link or page-number navigation using URL search params.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/unit/feed.test.ts
npx playwright test tests/e2e/feed.spec.ts --project=desktop-chrome
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/layout/Header.tsx src/components/layout/PublicAuthLink.tsx src/app/(public)/page.tsx src/lib/data.ts tests/unit/feed.test.ts tests/e2e/feed.spec.ts
git commit -m "feat: paginate and cache public feed"
```

---

## Gate 3: Launch Polish

### Task 10: Tighten banner upload ownership and cleanup

**Files:**
- Modify: `src/components/dashboard/AnnouncementForm.tsx`
- Modify: `supabase/migrations/20260411000003_storage.sql`
- Create: `supabase/migrations/20260514000016_banner_storage_policy.sql`
- Test: `tests/unit/announcement-form.test.ts`

- [ ] **Step 1: Change upload path**

Use a path containing owner identity:

```ts
const path = `${user.id}/${crypto.randomUUID()}.${ext}`
```

- [ ] **Step 2: Update storage policy**

Require authenticated upload paths to start with `auth.uid()`.

- [ ] **Step 3: Delete old banner on remove/replace**

When removing a banner, delete the object if it belongs to the current user and is in `banner-images`.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/unit/announcement-form.test.ts
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/dashboard/AnnouncementForm.tsx supabase/migrations/20260411000003_storage.sql supabase/migrations/20260514000016_banner_storage_policy.sql tests/unit/announcement-form.test.ts
git commit -m "feat: scope banner uploads to owners"
```

### Task 11: Add observability and uptime checks

**Files:**
- Create: `src/lib/observability.ts`
- Modify: route error boundaries
- Optional create: `src/app/api/health/route.ts`

- [ ] **Step 1: Add health route**

Create `/api/health` that returns app version, timestamp, and database reachability without exposing secrets.

- [ ] **Step 2: Centralize error logging**

Use `src/lib/observability.ts` for server action and error-boundary logging.

- [ ] **Step 3: Configure external monitor**

Monitor:

```text
https://bulletininti.vercel.app/
https://bulletininti.vercel.app/login
https://bulletininti.vercel.app/api/health
```

- [ ] **Step 4: Commit**

```powershell
git add src/lib/observability.ts src/app/api/health/route.ts src/app/(public)/error.tsx src/app/(dashboard)/error.tsx src/app/(auth)/error.tsx
git commit -m "feat: add production health and error telemetry"
```

### Task 12: Run accessibility and final design QA

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Modify public/admin UI only where failures are found

- [ ] **Step 1: Add accessibility smoke tests**

Cover:

```text
/
/login
/announcements/[known-id]
/dashboard
/admin/review
```

- [ ] **Step 2: Verify keyboard-only paths**

Manually test tab order, visible focus, search, category filters, announcement cards, login form, and review action buttons.

- [ ] **Step 3: Verify mobile screenshots**

Run:

```powershell
npx playwright test tests/e2e/feed.spec.ts --project=mobile-chrome
npx playwright test tests/e2e/feed.spec.ts --project=mobile-safari
```

- [ ] **Step 4: Commit**

```powershell
git add tests/e2e/accessibility.spec.ts
git commit -m "test: add accessibility launch smoke coverage"
```

---

## Launch Exit Criteria

Bulletin can be called production-ready only when all of these are true:

- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `npm test` passes.
- `npm run build` passes.
- `npm audit --omit=dev` has no high severity production findings.
- GitHub Actions is green on `main`.
- Vercel production deploy is from a green commit.
- `/robots.txt` returns 200.
- `/sitemap.xml` returns 200.
- Live homepage does not show `0 Topics`.
- Live announcements contain only current, approved launch content.
- Security headers are present on production responses.
- Public feed has pagination or a documented content cap.
- Rate limiting uses durable shared storage in production.

## Suggested Execution Order

1. Gate 0, Task 1: build blocker.
2. Gate 0, Task 2: CI gate.
3. Gate 0, Task 3: dependency audit.
4. Gate 1, Task 4: live content trust.
5. Gate 1, Task 5: markdown tables and sanitization.
6. Gate 1, Task 6: SEO/discovery.
7. Gate 2, Task 7: security headers.
8. Gate 2, Task 8: durable rate limiting.
9. Gate 2, Task 9: feed caching/pagination.
10. Gate 3, Tasks 10-12: upload cleanup, observability, accessibility QA.

## Hold Point

Implementation must wait here until the user says go.
