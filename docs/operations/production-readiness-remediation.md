# Production Readiness Remediation Plan

> Status: **PARTIAL — not yet safe for public launch.** Readiness 7.5/10.
> Source: production-readiness audit, 2026-06-02.
> Scope: invite-driven public launch with live data on Vercel + Supabase.
>
> Application code is production-grade. Remaining risk is concentrated in
> **Supabase project configuration** (verify out-of-band) plus one PII-in-logs
> code fix. Work the order below top-to-bottom; do not promote to production
> until every P0 box is checked.

---

## Legend

- **P0** — blocks public launch. Must be done.
- **P1** — fix before real users rely on the system.
- **P2 / P3** — post-launch hardening.
- 🔧 code change · ⚙️ config / dashboard · ✅ verification only

Each task lists: _why → steps → done-when_.

---

## Phase 0 — Critical blockers (P0)

### [ ] P0-1 🔧⚙️ Stop the auth trigger from trusting client-supplied `role`

**Why:** `public.handle_new_user()` derives the new user's role from
`raw_user_meta_data->>'role'`. The trigger fires on _every_ `auth.users`
insert, and the anon key is public. If Supabase email signups are enabled,
anyone can POST to `/auth/v1/signup` with `data: { role: "owner" }` and be
provisioned as platform owner. The app never calls `signUp` from the client,
so this is purely a project-config + trigger-hardening issue.

**Steps:**

1. ⚙️ Supabase Dashboard → Authentication → Sign In / Providers → **disable
   "Allow new users to sign up"** (registration is invitation-only via the
   admin client in `src/app/register/actions.ts`).
2. 🔧 Add a migration that hardens the trigger to ignore metadata role. The
   `register` action upserts the correct role with the service client
   immediately after creation, so nothing legitimate depends on the trigger
   honoring metadata.

   ```sql
   -- supabase/migrations/2026XXXXXXXXXX_harden_handle_new_user_role.sql
   create or replace function public.handle_new_user()
   returns trigger
   language plpgsql
   security definer
   set search_path = public, pg_catalog
   as $$
   declare
     profile_email text;
     profile_name  text;
   begin
     profile_email := coalesce(nullif(new.email, ''), 'user-' || new.id::text || '@auth.local');
     profile_name  := coalesce(
       nullif(new.raw_user_meta_data->>'display_name', ''),
       nullif(new.raw_user_meta_data->>'full_name', ''),
       nullif(new.raw_user_meta_data->>'name', ''),
       nullif(new.raw_user_meta_data->>'username', ''),
       split_part(profile_email, '@', 1)
     );

     -- Always provision the lowest-privilege role. Privileged roles are
     -- assigned only by the service-role client (register / setup / admin).
     insert into public.users (id, email, display_name, role)
     values (new.id, profile_email, profile_name, 'publisher')
     on conflict (id) do nothing;

     return new;
   end;
   $$;
   ```

3. ✅ Confirm the existing invite → register → login flow still assigns the
   invited role (it upserts after `auth.admin.createUser`).

**Done when:** signups are disabled in Supabase **and** the trigger no longer
reads `role` from metadata, verified by a manual `signup` attempt failing /
defaulting to `publisher`.

---

### [ ] P0-2 ✅ Confirm all 20 migrations + RLS are live in production

**Why:** RLS is the entire data boundary. Several migrations are _fixes_ to
earlier holes (004 closes role self-escalation, 013 adds the `WITH CHECK` that
blocks publisher self-publish, 015 revokes audit-log writes from
`anon`/`authenticated`). A missing or out-of-order migration silently
reintroduces those holes.

**Steps (run against the production project):**

```sql
-- 1. Every app table must have RLS on:
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
-- Expect rowsecurity = true for: users, organizations, organization_members,
-- categories, announcements, announcement_reviews, org_category_permissions,
-- invitations, audit_log, notifications, password_reset_requests,
-- rate_limit_buckets.

-- 2. Policies exist:
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. audit_log writes are revoked from public roles:
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'audit_log';
-- anon / authenticated must NOT have INSERT/UPDATE/DELETE.

-- 4. Storage bucket exists with limits:
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'banner-images';
```

**Done when:** all tables show `rowsecurity = true`, policy list matches the
migrations, audit-log write grants are absent for anon/authenticated, and the
bucket has the 5 MB / image-mime limits.

---

### [ ] P0-3 ⚙️ Bootstrap the owner account; lock down setup vars

**Why:** `/api/setup` hard-returns 404 in production, so the owner cannot be
created via the route there. The platform needs exactly one owner.

**Steps:**

1. ⚙️ Create the owner once via SQL (per the note in
   `20260503000010_owner_role.sql`):
   ```sql
   update public.users
   set role = 'owner', force_password_change = true
   where email = '<owner-email>';
   ```
   (The auth user must already exist — create it via invite, or temporarily in
   a non-prod env using the setup route.)
2. ⚙️ Confirm these are **unset** in the production environment:
   `ENABLE_SETUP_ROUTE`, `SETUP_SECRET`, `SETUP_OWNER_EMAIL`,
   `SETUP_OWNER_USERNAME`, `SETUP_OWNER_TEMP_PASSWORD`, `E2E_DISABLE_RATE_LIMIT`.

**Done when:** exactly one `role = 'owner'` row exists and setup vars are absent
in prod (and `/api/setup` returns 404).

---

## Phase 1 — High priority (P1)

### [ ] P1-1 🔧 Stop logging PII (emails) to server logs

**Why:** `reportServerError` redacts sensitive keys only on the Sentry path.
The trailing `console.error('[server-error]', log)` prints raw `metadata`,
which routinely contains `email`. This violates `.claude/rules/security.md`
("Never log secrets, tokens, passwords, or PII") and lands emails in Vercel
runtime logs.

**Files:** `src/lib/error-reporting.ts:62`, `src/lib/client-error-reporting.ts:62`.

**Steps:** apply the existing `sentryMetadata()` redaction (or an equivalent)
to the metadata before it reaches `console.error`. Sketch:

```ts
// in reportServerError, build the console payload with redacted metadata
const safeLog = { ...log, metadata: sentryMetadata(metadata) }
console.error('[server-error]', safeLog)
```

Do the same for `reportServerWarning` and the client reporter.

**Done when:** a forced error whose metadata includes `email` shows
`[redacted]` in the server log output. Cover with a unit test
(`tests/unit/errors/server-logging-source.test.ts` already exists — extend it).

---

### [ ] P1-2 ⚙️ Set `CRON_SECRET`; confirm cron auth

**Why:** `cleanup-orphan-banners` returns 404 when `CRON_SECRET` is unset, so
the daily cron silently no-ops and orphaned banner images accumulate (cost +
clutter) with no error.

**Files:** `src/app/api/maintenance/cleanup-orphan-banners/route.ts`, `vercel.json`.

**Steps:**

1. ⚙️ Set `CRON_SECRET` in the production environment.
2. ✅ Confirm Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
3. ✅ Hit the route once with `?dryRun=1` + the bearer header; expect
   `ok: true`.

**Done when:** an authorized dry-run returns 200 and an unauthorized request
returns 401.

---

### [ ] P1-3 ⚙️ Decide the password-reset model

**Why:** `forgot-password` does not email a reset link. It queues a
`password_reset_requests` row and notifies owners/super-admins, who set a temp
password by hand. A human sees/sets passwords and it doesn't scale.

**Files:** `src/app/(auth)/forgot-password/actions.ts`,
`src/app/(super-admin)/super-admin/users/actions.ts`.

**Options:**

- **Keep manual** (acceptable for a small invite-only campus tool) — document
  it as the intended model and ensure super-admins know the runbook.
- **Self-service** — wire Supabase `resetPasswordForEmail` + an SMTP provider
  and add a reset-callback page.

**Done when:** a decision is recorded here and, if self-service is chosen, it is
implemented and tested.

---

### [ ] P1-4 ⚙️🔧 Strengthen password policy

**Why:** minimum is 8 chars with no complexity/breach check, enforced only in
the actions.

**Files:** `src/app/register/actions.ts`, `src/app/change-password/actions.ts`,
`src/app/(super-admin)/super-admin/users/actions.ts`.

**Steps:**

1. ⚙️ Supabase Auth → enable minimum length ≥12 and the leaked-password
   (HaveIBeenPwned) check.
2. 🔧 Raise the in-action minimum from 8 to 12 in the three files above so the
   client-side message matches.

**Done when:** registering / changing to an 8-char password is rejected with a
clear message.

---

## Phase 2 — Post-launch hardening (P2 / P3)

### [ ] P2-1 🔧 Throttle the public view counter

`recordAnnouncementView` is unauthenticated with no rate limit, so `view_count`
can be inflated in a loop. Add an IP-scoped throttle (reuse
`checkPersistentRateLimit` with an `view:<id>` key) or accept it as
analytics-only. File: `src/app/(public)/announcements/[id]/actions.ts`.

### [ ] P2-2 🔧 Tighten CSP `style-src`

`style-src 'unsafe-inline'` is present in `src/proxy.ts`. script-src is already
nonce + `strict-dynamic`. Move inline styles to nonce/hashes if practical;
otherwise document the accepted residual risk.

### [ ] P3-1 ⚙️ Data retention policy

`audit_log.metadata` and `password_reset_requests` store emails/PII with no
retention window. Document a retention period and, if needed, a periodic purge.

### [ ] P3-2 ✅ Re-review the "edit while submitted" workflow

RLS `WITH CHECK` permits a publisher to edit a `submitted` announcement without
re-review (mig 013). Minor workflow gap, not a security issue — confirm it is
intended.

### [ ] P3-3 ⚙️ Consider a data export/delete flow

Out of scope for an internal board, but required if you collect data on
students who are not staff.

---

## Recommended fix order

1. P0-1 — disable signups + harden `handle_new_user`.
2. P0-2 — verify migrations + RLS in production.
3. P0-3 — create owner; confirm setup vars unset.
4. P1-1 — redact metadata in the logger.
5. P1-2 — set `CRON_SECRET`.
6. P1-4 — strengthen password policy.
7. P1-3 — decide reset model.
8. Confirm backups / PITR enabled (see `backup-rollback.md`).
9. P2 / P3 — after launch.

---

## Pre-launch verification gate (run before promoting to production)

- [ ] `npx tsc --noEmit` passes _(currently ✅)_
- [ ] `npm run lint` passes _(currently ✅)_
- [ ] `npm test` (unit suite) passes
- [ ] `npm run build` succeeds with production env vars
- [ ] `tests/e2e/rls-isolation.spec.ts` passes against a real project
- [ ] Anon client cannot read non-published announcements or other users' rows
- [ ] Publisher cannot reach `/admin`/`/owner`; cannot publish (only submit)
- [ ] `/api/setup` returns 404 in prod
- [ ] `/api/health` returns `ok: true`
- [ ] `/robots.txt` disallows `/admin/`, `/super-admin/`, `/owner/`, `/dashboard/`
- [ ] `/sitemap.xml` lists only published, non-expired announcements
- [ ] Supabase automated backups / PITR enabled

---

## Environment reference

**Required (prod):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(client-safe); `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (server-only);
`NEXT_PUBLIC_APP_URL` (client-safe).

**Recommended:** `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_ORG`/`SENTRY_PROJECT`/
`SENTRY_AUTH_TOKEN`; `NEXT_PUBLIC_POSTHOG_TOKEN`/`NEXT_PUBLIC_POSTHOG_HOST`;
`RATE_LIMIT_BACKEND`.

**Must stay UNSET in prod:** `ENABLE_SETUP_ROUTE`, `SETUP_SECRET`,
`SETUP_OWNER_EMAIL`, `SETUP_OWNER_USERNAME`, `SETUP_OWNER_TEMP_PASSWORD`,
`E2E_DISABLE_RATE_LIMIT`.

**Never client-exposed:** `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
`SETUP_SECRET`, `SETUP_OWNER_TEMP_PASSWORD`, `SENTRY_AUTH_TOKEN`,
`VERCEL_API_TOKEN`, `SUPABASE_ACCESS_TOKEN`.
