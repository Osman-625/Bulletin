# Debug And Fix Workflow

Use this when something is broken or a test fails.

1. Reproduce the failure or capture the exact error.
2. Identify the first bad behavior, not just the final symptom.
3. Inspect the smallest related code path.
4. Form one concrete hypothesis.
5. Test or inspect that hypothesis.
6. Patch the root cause.
7. Re-run the failing check.
8. Add regression coverage when practical.

Do not rewrite broad areas while debugging unless the root cause requires it.
