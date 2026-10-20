---
paths:
  - 'supabase/migrations/**'
  - 'supabase/seed-sample-announcements.sql'
  - 'src/lib/database.types.ts'
  - 'src/lib/data.ts'
---

# Database

## Types

- Use `src/lib/database.types.ts` for table, enum, insert, update, and row types.
- Do not hand-edit `database.types.ts`.
- Regenerate types after schema changes.

## Migrations

- Never modify an existing migration that may have run.
- Add a new timestamped migration at the end of `supabase/migrations/`.
- Keep schema changes and index changes separate when practical.
- Do not seed production data in migrations.
- Do not drop columns or tables without explicit user confirmation.

## RLS

- Preserve row-level security as the data boundary.
- Any feature that changes visibility must include matching RLS thinking.
- Server actions must still authorize; RLS is not a replacement for action-level checks.

## Data Access

- Prefer `src/lib/data.ts` and domain modules under `src/lib/**` over direct scattered queries.
- Keep announcement date/time display logic centralized in `src/lib/announcements/public-board.ts`.
- Use `Asia/Kuala_Lumpur` for announcement display dates.
