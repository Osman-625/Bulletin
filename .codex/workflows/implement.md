# Implement Workflow

Use this for feature work and non-trivial fixes.

1. Read `AGENTS.md`.
2. Read relevant `.codex/rules/*.md`.
3. Inspect existing code before deciding on an approach.
4. For Next.js APIs, read the matching docs under `node_modules/next/dist/docs/`.
5. For DB work, inspect `src/lib/database.types.ts` and existing migrations.
6. Make the smallest coherent change.
7. Add or update focused tests when behavior changes.
8. Run narrow verification first, then broader checks if the blast radius is large.
9. Summarize changed files, verification, and any remaining risk.
