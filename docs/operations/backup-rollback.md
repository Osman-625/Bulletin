# Backup, Rollback, and Debug Channels

This runbook covers the current Bulletin level: a single Next.js application on Vercel with Supabase Postgres, Auth, and Storage.

## Daily backup

- GitHub Actions runs `.github/workflows/database-backup.yml` daily at 19:23 UTC.
- Required secret: `SUPABASE_DB_URL`, using a Supabase connection string with enough access to run `pg_dump`.
- Output: a custom-format Postgres dump plus a SHA-256 checksum, retained as a GitHub artifact for 7 days.
- Treat every artifact as sensitive production data. Restrict repository access and never attach backup artifacts to tickets or chat.

## Rollback drill

1. Pause writes if there is an active data incident.
2. Download the newest known-good backup artifact and verify its checksum.
3. Restore into a temporary Supabase project first with `pg_restore --clean --if-exists --no-owner --no-privileges`.
4. Run smoke checks against the temporary project: login, public feed, dashboard reads, announcement publish/update, and `/api/health`.
5. If the temporary restore is clean, decide whether to promote the restored database, replay missing safe writes, or restore only affected tables.

Do not auto-restore over production from CI. Human approval is required because rollback can destroy valid writes made after the backup.

## Debug channels

- `/api/health`: no-store health probe with database reachability and a request id.
- Vercel runtime logs: request failures, function duration, cold starts, and cron execution.
- Sentry errors: server, route handler, React, and proxy failures without hardcoded DSNs.
- Supabase project logs: Postgres errors, Auth issues, API errors, and storage access denials.
- GitHub Actions: test, build, migration, security scan, and database backup workflow history.
- Backup artifacts: daily rollback source for recent database recovery.

## Current gaps

- Supabase point-in-time recovery must be enabled and tested in the Supabase dashboard for production-grade rollback.
- Storage object backups are not covered by the simple database dump workflow.
- Disaster recovery still needs a quarterly restore drill and an owner-approved incident checklist.
