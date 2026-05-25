---
paths:
  - 'src/app/api/**'
  - 'src/app/(auth)/**'
  - 'src/app/**/actions.ts'
  - 'src/lib/**'
  - 'src/proxy.ts'
---

# Security

## Auth Boundary

- `src/proxy.ts` is the single auth gateway. Do not create `src/middleware.ts`.
- Preserve session refresh, CSP nonce behavior, and role redirects when touching proxy code.
- Authorization has three layers: Supabase RLS, `src/proxy.ts`, and server actions.

## Server Actions

- Re-check authenticated user inside every write action.
- Re-check role or ownership before every write.
- Return `Unauthorized` for missing user and `Forbidden` for insufficient role.
- Never trust caller-provided role, organization, or owner fields.

## Supabase

- Use `src/lib/supabase/server.ts` for RSC and server actions.
- Use `src/lib/supabase/client.ts` only in client components.
- Use `src/lib/supabase/admin.ts` only on the server and only when service-role access is necessary.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Public Mutation Endpoints

- Apply rate limiting through `src/lib/security/`.
- Validate inputs at the route or action boundary.
- Use parameterized database calls and Supabase query builders.
- Do not log secrets, tokens, passwords, or PII.

## CSP And Scripts

- Any new script handling must preserve nonce requirements from `src/proxy.ts`.
- Do not weaken CSP for convenience.
