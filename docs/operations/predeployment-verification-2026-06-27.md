# Pre-Deployment Verification - 2026-06-27

This record captures only checks that were actually run during the 2026-06-27 pre-deployment remediation pass. A check is marked `PASS` only when the command completed with exit code `0`.

## Local Gates

| Gate                         | Target          | Command                                   |    Exit | Result                                                                                                                                                                 |
| ---------------------------- | --------------- | ----------------------------------------- | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting                   | Local workspace | `npm run format:check`                    |       0 | PASS - all matched files used Prettier style after the initial formatting cleanup.                                                                                     |
| Formatting, post-final edits | Local workspace | `npm run format:check`                    | Blocked | BLOCKED - Windows sandbox failed with `CreateProcessAsUserW 1312`; unsandboxed rerun was rejected by the approval layer.                                               |
| Install audit summary        | Local workspace | `npm install`                             |       0 | PASS - after final dependency changes, npm audited 933 packages and reported `found 0 vulnerabilities`.                                                                |
| Full npm audit               | Local workspace | `npm audit --audit-level=high`            | Blocked | BLOCKED - earlier remediation pass succeeded, but the post-final-edit command hit `CreateProcessAsUserW 1312`.                                                         |
| Production npm audit         | Local workspace | `npm audit --omit=dev --audit-level=high` |       0 | PASS - found 0 vulnerabilities after dependency remediation.                                                                                                           |
| React Doctor latest score    | Local workspace | `npx react-doctor@latest --score`         |       0 | PASS - score command returned `35`.                                                                                                                                    |
| React Doctor local scan      | Local workspace | `npm run doctor`                          |       1 | FAIL - local scan ran on `react-doctor@0.5.8` and reported existing security diagnostics. A rerun after the PostHog package update was rejected by the approval layer. |
| Lint                         | Local workspace | `npm run lint`                            |       0 | PASS                                                                                                                                                                   |
| TypeScript                   | Local workspace | `npx tsc --noEmit`                        |       0 | PASS                                                                                                                                                                   |
| Build                        | Local workspace | `npm run build`                           |       0 | PASS - Next.js 16.2.6 production build completed and generated 48 static pages.                                                                                        |
| Unit tests                   | Local workspace | `npm test`                                |       0 | PASS - 48 test files and 306 tests passed.                                                                                                                             |
| E2E tests                    | Local workspace | `npm run test:e2e`                        | Blocked | BLOCKED - Windows sandbox failed before Playwright started with `CreateProcessAsUserW 1312`.                                                                           |

## Supabase Gates

| Gate                       | Target                    | Command                                                                                                   |    Exit | Result                                                                                        |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- | ------: | --------------------------------------------------------------------------------------------- |
| Changelog check            | Supabase docs             | `curl.exe --fail https://supabase.com/changelog.md`                                                       |       0 | PASS - fetched current changelog before migration work.                                       |
| Migration creation         | Local workspace           | `npx supabase migration new replace_storage_auth_role_predicates`                                         |       0 | PASS - created `supabase/migrations/20260627101049_replace_storage_auth_role_predicates.sql`. |
| CLI help                   | Local workspace           | `npx supabase --help`                                                                                     |     124 | BLOCKED - command timed out in this environment.                                              |
| CLI version                | Local workspace           | `npx supabase --version`                                                                                  |       0 | PASS - Supabase CLI version `2.108.0`.                                                        |
| Local migration list       | Local Supabase DB         | `npx supabase migration list --local`                                                                     |       1 | FAIL - local database is not running on `127.0.0.1:54322`.                                    |
| Linked migration list      | Linked Supabase project   | `npx supabase migration list --linked`                                                                    |       1 | FAIL - checkout is not linked to a Supabase project.                                          |
| Linked advisors            | Linked Supabase project   | `npx supabase db advisors --linked`                                                                       |       1 | FAIL - checkout is not linked to a Supabase project.                                          |
| New migration source check | Local workspace           | `rg -n "auth\\.role\\(\\)" supabase\\migrations\\20260627101049_replace_storage_auth_role_predicates.sql` |       1 | PASS - no executable deprecated helper references remain in the new migration file.           |
| Storage policy query       | Local/staging Supabase DB | `select ... from pg_policies ... auth.role ...`                                                           | Not run | PENDING - requires a reachable Supabase database.                                             |

## External Gates

| Gate                     | Target             | Command / Action                                                                      |    Exit | Result                                                                                                                       |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------- | ------: | ---------------------------------------------------------------------------------------------------------------------------- |
| Preview smoke            | Vercel preview     | `PLAYWRIGHT_BASE_URL=<vercel-preview-url> npm run test:smoke`                         | Not run | PENDING - preview URL not available in this session.                                                                         |
| Production smoke         | Production         | `PLAYWRIGHT_BASE_URL=https://bulletininti.vercel.app npm run test:smoke`              | Blocked | BLOCKED - Windows sandbox failed before Playwright started with `CreateProcessAsUserW 1312`.                                 |
| Health endpoint          | Production         | `curl.exe --fail https://bulletininti.vercel.app/api/health`                          |       0 | PASS - returned `ok: true`, `status: ok`, and database `status: ok` with `latencyMs: 990`.                                   |
| Maintenance dry run      | Production         | `GET https://bulletininti.vercel.app/api/maintenance/cleanup-orphan-banners?dryRun=1` | Blocked | BLOCKED - local curl process failed with `CreateProcessAsUserW 1312`; valid `CRON_SECRET` was not available in this session. |
| GitHub Security Scan     | GitHub Actions     | Manual `Security Scan` workflow with target `https://bulletininti.vercel.app/`        | Not run | PENDING - requires GitHub workflow access.                                                                                   |
| GitHub Database Backup   | GitHub Actions     | Manual `Database Backup` workflow                                                     | Not run | PENDING - requires GitHub workflow access.                                                                                   |
| Restore drill            | Temporary database | Verify `.sha256`, restore `.dump`, run smoke checks                                   | Not run | PENDING - requires backup artifact and temporary restore database.                                                           |
| Vercel env verification  | Vercel project     | Verify required env vars are present                                                  | Not run | PENDING - requires Vercel project access.                                                                                    |
| GitHub branch protection | GitHub repo        | Verify `main` requires release gates                                                  | Not run | PENDING - requires GitHub repository settings access.                                                                        |

## Remaining Launch Blockers

- `npm run doctor` is not green. The verified local scan reported existing diagnostics and the post-PostHog-update rerun was rejected by the approval layer.
- Post-final-edit `npm run format:check` and `npm audit --audit-level=high` could not be rerun because local process creation failed; `npm install` and production audit both reported zero vulnerabilities after dependency remediation.
- E2E and production smoke are blocked by local Playwright process-spawn failures in this environment.
- Supabase linked verification is not complete because this checkout is not linked to a Supabase project, and the local Supabase database is not running.
- ZAP scan, backup workflow, restore drill, Vercel env verification, maintenance dry-run with `CRON_SECRET`, and GitHub branch protection checks remain pending until the required external access is available.

## 2026-06-28 Continuation

Continuation checks below were run from the local workspace on 2026-06-28. A check is marked `PASS` only when the command completed with exit code `0`.

### Local Gates

| Gate                           | Target          | Command                                                                  |    Exit | Result                                                                                                                        |
| ------------------------------ | --------------- | ------------------------------------------------------------------------ | ------: | ----------------------------------------------------------------------------------------------------------------------------- |
| React Doctor config unit guard | Local workspace | `npm test -- tests/unit/tooling/react-doctor-config.test.ts`             |       0 | PASS - 1 test file and 9 tests passed after adding targeted React Doctor override guards.                                     |
| Production npm audit           | Local workspace | `npm audit --omit=dev --audit-level=high`                                |       0 | PASS - found 0 vulnerabilities.                                                                                               |
| Lint                           | Local workspace | `npm run lint`                                                           |       0 | PASS.                                                                                                                         |
| TypeScript                     | Local workspace | `npx tsc --noEmit`                                                       |       0 | PASS on final rerun.                                                                                                          |
| Build                          | Local workspace | `npm run build`                                                          |       0 | PASS - Next.js 16.2.6 production build completed and generated 48 static pages.                                               |
| Unit tests                     | Local workspace | `npm test`                                                               |       0 | PASS - 48 test files and 307 tests passed after updating the stale performance source guard for explicit user-column selects. |
| Formatting                     | Local workspace | `npm run format:check`                                                   |       0 | PASS - all matched files use Prettier code style after formatting the generated React Doctor workflow.                        |
| Full npm audit                 | Local workspace | `npm audit --audit-level=high`                                           |       0 | PASS - found 0 vulnerabilities.                                                                                               |
| React Doctor local scan        | Local workspace | `npm run doctor`                                                         |       0 | PASS - local pinned `react-doctor@0.5.8` ran non-interactively and reported no issues, score `100 / 100`.                     |
| E2E tests                      | Local workspace | `npm run test:e2e`                                                       | Blocked | BLOCKED - Windows sandbox failed before Playwright started with `CreateProcessAsUserW 1312`.                                  |
| Production smoke               | Production      | `PLAYWRIGHT_BASE_URL=https://bulletininti.vercel.app npm run test:smoke` | Blocked | BLOCKED - Windows sandbox failed before Playwright started with `CreateProcessAsUserW 1312`.                                  |

### React Doctor Triage

| Finding bucket                          | Verification evidence                                                                                                                                           | Action                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Historical initial schema RLS warning   | `20260411000001_schema.sql` creates initial tables; `20260411000002_rls.sql` enables RLS on those same tables immediately after.                                | Added a targeted `doctor.config.json` override for `react-doctor/supabase-table-missing-rls` on the initial schema migration only.   |
| Historical audit log insert policy      | `20260418000004_fixes_and_additions.sql` added `"audit_log: service insert"`; `20260518000015_security_hardening.sql` drops it and revokes browser-role writes. | Added a targeted override for `react-doctor/supabase-rls-policy-risk` on the historical migration only.                              |
| Server-only authz-field false positives | The reported files are server actions/pages, path constants, or server-side role checks rather than client-owned browser writes.                                | Added exact-file overrides for `react-doctor/supabase-client-owned-authz-field`; the unit guard prevents broad `src/**` suppression. |
| Generated artifact warning              | Reported files were generated artifacts under `.next/` and `graphify-out/`, not source files.                                                                   | Added an artifact-only override for `react-doctor/artifact-baas-authority-surface`.                                                  |

### Supabase Gates

| Gate                       | Target                  | Command                                                                                                   |    Exit | Result                                                                              |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- | ------: | ----------------------------------------------------------------------------------- |
| CLI version                | Local workspace         | `npx supabase --version`                                                                                  |       0 | PASS - Supabase CLI version `2.108.0`.                                              |
| Linked migration list      | Linked Supabase project | `npx supabase migration list --linked`                                                                    |       1 | FAIL - checkout is not linked to a Supabase project.                                |
| Linked advisors            | Linked Supabase project | `npx supabase db advisors --linked`                                                                       |       1 | FAIL - checkout is not linked to a Supabase project.                                |
| Local migration list       | Local Supabase DB       | `npx supabase migration list --local`                                                                     |       1 | FAIL - local database is not running on `127.0.0.1:54322`.                          |
| New migration source check | Local workspace         | `rg -n "auth\\.role\\(\\)" supabase\\migrations\\20260627101049_replace_storage_auth_role_predicates.sql` |       1 | PASS - no deprecated helper references were found in the new replacement migration. |
| Storage policy query       | Local/staging DB        | `select ... from pg_policies ... auth.role ...`                                                           | Not run | PENDING - requires a reachable Supabase database.                                   |

### External Gates

| Gate                          | Target         | Command / Action                                                                                                        |    Exit | Result                                                                                      |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- | ------: | ------------------------------------------------------------------------------------------- |
| Health endpoint               | Production     | `curl.exe --fail https://bulletininti.vercel.app/api/health`                                                            |       0 | PASS - returned `ok: true`, `status: ok`, and database `status: ok` with `latencyMs: 913`.  |
| Maintenance no-secret posture | Production     | `curl.exe --fail --silent --show-error https://bulletininti.vercel.app/api/maintenance/cleanup-orphan-banners?dryRun=1` |       1 | Expected failure - HTTP 404 without `CRON_SECRET`; this is not a dry-run verification pass. |
| Setup route posture           | Production     | `curl.exe --fail --silent --show-error -X POST https://bulletininti.vercel.app/api/setup`                               |       1 | Expected failure - HTTP 404, consistent with setup route being disabled in production.      |
| Preview smoke                 | Vercel preview | `PLAYWRIGHT_BASE_URL=<vercel-preview-url> npm run test:smoke`                                                           | Not run | PENDING - preview URL not available in this session.                                        |
| GitHub Security Scan          | GitHub Actions | Manual `Security Scan` workflow with target `https://bulletininti.vercel.app/`                                          | Not run | PENDING - requires GitHub workflow access.                                                  |
| GitHub Database Backup        | GitHub Actions | Manual `Database Backup` workflow                                                                                       | Not run | PENDING - requires GitHub workflow access.                                                  |
| Restore drill                 | Temporary DB   | Verify `.sha256`, restore `.dump`, run smoke checks                                                                     | Not run | PENDING - requires backup artifact and temporary restore database.                          |
| Vercel env verification       | Vercel project | Verify `CRON_SECRET`, Supabase env vars, Sentry env vars, and public app URL                                            | Not run | PENDING - requires Vercel project access.                                                   |
| GitHub branch protection      | GitHub repo    | Verify `main` requires release gates                                                                                    | Not run | PENDING - requires GitHub repository settings access.                                       |

### Current Launch Blockers After Continuation

- `npm run test:e2e` and production smoke still lack current green runs because Playwright could not start in this environment.
- Supabase live policy verification is still blocked until the checkout is linked or a local/staging Supabase database is reachable.
- Vercel env verification, maintenance dry run with a valid `CRON_SECRET`, GitHub Security Scan, database backup, restore drill, storage backup coverage, and branch-protection verification remain pending external gates.
