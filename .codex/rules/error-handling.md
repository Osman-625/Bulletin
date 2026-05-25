---
paths:
  - 'src/app/api/**'
  - 'src/app/**/actions.ts'
  - 'src/lib/**'
---

# Error Handling

- Do not swallow errors silently.
- Preserve useful context when rethrowing or logging.
- Do not expose stack traces, internal paths, raw SQL, Supabase internals, or secrets in production responses.
- Use consistent response shapes for route handlers.
- Handle rejected promises; no floating async work unless deliberately fire-and-forget with local error handling.
- Retry only transient failures such as network timeouts or rate limits. Do not retry validation or authorization failures.
- Include request or correlation identifiers in logs when available.
