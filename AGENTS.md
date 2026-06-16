# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## Project — Bulletin

Campus announcement platform for INTI International University. Next.js 16.2.6 App Router + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Vercel.

**Live:** `https://bulletininti.vercel.app/`
**Repo:** `https://github.com/Osman6202/Bulletin`

---

## Before You Write Code

1. **Read the Next.js 16 docs** for any API you plan to use — `node_modules/next/dist/docs/`
2. **Check `src/lib/database.types.ts`** for all DB shape types. Never infer or hand-write them.
3. **Read `src/app/globals.css`** before touching any color, spacing, or animation — all design tokens live there.
4. **Read `src/proxy.ts`** before touching auth, session, redirects, or CSP — it is the single auth gateway.

---

## Design System — Future Commons

Visual direction: warm, official, alive. Editorial campus board — not SaaS, not social media.

### Palette (use CSS tokens, never raw hex in components)

| Token                 | Light     | Dark                | Role                    |
| --------------------- | --------- | ------------------- | ----------------------- |
| `--color-canvas`      | `#F8F2DF` | `#15110f`           | Page background         |
| `--color-surface`     | `#FFFAF0` | elevated near-black | Cards, panels           |
| `--color-accent-inti` | `#C8102E` | `#e8203a`           | Primary action, urgency |
| `--color-navy`        | `#143A5F` | same                | Institutional support   |
| `--color-gold`        | `#D4941F` | same                | Secondary accent        |

### Typography

- **Display headings:** Bricolage Grotesque (`font-display`)
- **Body / UI:** Atkinson Hyperlegible (`font-sans`)
- **Metadata / code:** Geist Mono (`font-mono`)

### Layout

- Public feed: bento grid (`dense` auto-flow, col/row span variants)
- Dashboard: sidebar shell (`DashboardShell` + `DashboardSidebar` + `DashboardTopNav`)
- Mobile-first. Touch targets ≥ 44px. WCAG AA minimum (4.5:1 body, 3:1 UI).

---

## Route Groups and Roles

| Group           | Path           | Role            | Auth     |
| --------------- | -------------- | --------------- | -------- |
| `(public)`      | `/`            | Anyone          | None     |
| `(auth)`        | `/login` etc.  | Unauthenticated | None     |
| `(dashboard)`   | `/dashboard`   | `publisher`     | Required |
| `(admin)`       | `/admin`       | `admin`         | Required |
| `(super-admin)` | `/super-admin` | `super_admin`   | Required |
| `(owner)`       | `/owner`       | `owner`         | Required |

Role enforcement layers (all three must hold):

1. **Supabase RLS** — data boundary, always on
2. **`src/proxy.ts`** — session refresh + redirect by role
3. **Server actions** — re-check authorization before every write

---

## Key Files

| File                                        | Purpose                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `src/proxy.ts`                              | Auth gateway — session, CSP nonce, role redirect            |
| `src/app/globals.css`                       | All design tokens, Tailwind v4 layers, animation primitives |
| `src/lib/database.types.ts`                 | Generated Supabase types — never hand-edit                  |
| `src/lib/data.ts`                           | Main data access functions                                  |
| `src/lib/announcements/public-board.ts`     | Feed grouping, MYT timezone logic                           |
| `src/lib/auth/authz.ts`                     | Authorization helpers                                       |
| `src/lib/security/rate-limit.ts`            | In-memory rate limiting                                     |
| `src/lib/security/persistent-rate-limit.ts` | DB-backed rate limiting (production)                        |
| `supabase/migrations/`                      | 20 ordered migrations — apply in filename order             |

---

## Patterns to Follow

### Server Actions

```ts
// Always re-check auth inside the action — never trust the caller
const {
  data: { user },
} = await supabase.auth.getUser()
if (!user) return { error: 'Unauthorized' }
const authorized = await checkUserRole(user.id, 'publisher')
if (!authorized) return { error: 'Forbidden' }
```

### Supabase client selection

- `src/lib/supabase/server.ts` — RSC and server actions (cookie-based session)
- `src/lib/supabase/client.ts` — client components only
- `src/lib/supabase/admin.ts` — service role, never expose to client

### CSS tokens in components

```tsx
// Correct — use CSS token
className = 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'

// Wrong — never hard-code
className = 'bg-[#FFFAF0] text-[#241815]'
```

### Date/time

All announcement dates must use `Asia/Kuala_Lumpur`. Centralized in `src/lib/announcements/public-board.ts`. Never use `new Date()` directly for display.

---

## What NOT To Do

- Do not create `src/middleware.ts` — the project uses `src/proxy.ts` (Next 16 convention)
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to any client component or browser
- Do not bypass server action authorization with direct DB calls
- Do not hard-code hex colors — use `globals.css` tokens
- Do not add `any` types — derive from `database.types.ts`
- Do not skip rate limiting on public-facing mutation endpoints
- Do not audit or fix UI without following `.claude/rules/ux-research-quality.md` (Seven Deadly Sins of UX Research) — verify before changing, fix root causes not symptoms, preserve the 3-column board and data behavior, report every bug with file/cause/visible failure/exact fix/test step
