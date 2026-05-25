# Ship Workflow

Use this when work is complete and ready to hand back.

1. Check `git status --short`.
2. Confirm only intended files changed.
3. Run the verification level that matches the change:
   - Documentation or prompt changes: file inspection plus format check when relevant.
   - TS logic: lint, typecheck, and focused tests.
   - Frontend behavior: lint, typecheck, build or Playwright/browser check.
   - Security/auth/data access: lint, typecheck, focused tests, and security review.
4. Summarize what changed and what passed.
5. Mention anything not run.
