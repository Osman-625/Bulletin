---
alwaysApply: true
---

# Testing

## Commands

- Unit tests: `npm test`.
- Watch mode: `npm run test:watch`.
- E2E: `npm run test:e2e`.
- Smoke: `npm run test:smoke`.
- Typecheck: `npx tsc --noEmit`.
- Lint: `npm run lint`.

## Practice

- Verify behavior, not implementation details.
- Prefer focused tests for changed behavior.
- Mock only at real boundaries: network, filesystem, clock, randomness, and third-party services.
- Avoid `expect(true)`, empty assertions, or mock call-count checks without checking meaningful arguments.
- If a test is flaky, identify the cause instead of retrying it into passing.

## Before Completion

- Run the narrowest meaningful check first.
- For shared logic, auth, security, or data access changes, run unit tests plus typecheck and lint.
- For public UI or dashboard flow changes, run a browser or Playwright check when practical.
