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
