# Bulletin

> Centralized university announcement platform for INTI International University

Bulletin consolidates scattered university communications — WhatsApp groups, Instagram posts, email chains, and physical noticeboards — into a single broadcast hub with role-based publishing and moderation.

---

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16.2.3 (App Router) + TypeScript          |
| UI         | React 19 · Tailwind CSS v4 · shadcn/ui            |
| Database   | Supabase — PostgreSQL + Row Level Security        |
| Auth       | Supabase Auth                                     |
| Storage    | Supabase Storage                                  |
| Hosting    | Vercel                                            |
| Unit tests | Vitest                                            |
| E2E tests  | Playwright (Chrome · Safari · Mobile Chrome · Mobile Safari) |

---

## Roles

| Role        | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| Super Admin | Platform owner — full control over all orgs and users        |
| Admin       | SA Director / Student Council President — manages one org    |
| Owner       | Organization owner — scoped to their own organization        |
| Publisher   | Approved clubs and departments — creates announcements       |
| Public      | Students and visitors — read-only, no account required       |

---

## Project Structure

```
src/
├── app/
│   ├── (public)/                    # Public feed + announcement detail (no auth)
│   ├── (auth)/login/                # Login page
│   ├── (dashboard)/dashboard/       # Publisher dashboard — create & edit announcements
│   ├── (admin)/admin/               # Admin panel
│   │   ├── analytics/
│   │   ├── categories/
│   │   ├── orgs/new/
│   │   ├── publishers/invite/
│   │   ├── review/[id]/             # Announcement approval workflow
│   │   └── users/
│   ├── (owner)/owner/               # Owner panel
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── categories/
│   │   └── users/
│   ├── (super-admin)/super-admin/   # Super-admin panel
│   │   ├── admins/invite/
│   │   ├── analytics/
│   │   ├── categories/
│   │   └── users/
│   ├── api/setup/                   # Owner bootstrap API route
│   ├── change-password/
│   └── register/
├── components/
│   ├── announcements/
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   └── ui/                          # shadcn/ui components
└── lib/
    ├── announcements/
    ├── auth/
    ├── security/
    └── supabase/                    # Supabase client helpers

supabase/
├── migrations/                      # 12 SQL migration files
└── seed.sql

scripts/
├── setup-owner.ps1                  # Bootstrap owner account (PowerShell)
├── seed-test-users.js               # Seed E2E test accounts
└── seed.sql                         # Dev seed data

tests/e2e/
├── auth.spec.ts
├── feed.spec.ts
├── routing.spec.ts
├── setup-route.spec.ts
└── users.spec.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Vercel account (for deployment)

### Local Setup

```bash
git clone https://github.com/Osman6202/Bulletin.git
cd Bulletin
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SETUP_SECRET=                # secret token for the /api/setup bootstrap route
```

### Database Setup

```bash
# Apply all migrations to your Supabase project
supabase db push

# (Optional) seed dev data
psql $DATABASE_URL -f scripts/seed.sql
```

### Bootstrap Owner Account

```powershell
# Windows — creates the first owner account via the setup API route
./scripts/setup-owner.ps1
```

---

## Available Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start dev server on port 3000            |
| `npm run build`       | Production build                         |
| `npm run start`       | Start production server                  |
| `npm run lint`        | ESLint                                   |
| `npm run format`      | Prettier — write                         |
| `npm run format:check`| Prettier — check only                    |
| `npm run test`        | Vitest unit tests (single run)           |
| `npm run test:watch`  | Vitest in watch mode                     |
| `npm run test:e2e`    | Playwright E2E tests                     |
| `npm run test:e2e:ui` | Playwright with interactive UI           |

### Running E2E Tests

```bash
# 1. Copy and fill in test env vars
cp .env.test.example .env.test.local

# 2. Seed test accounts
node scripts/seed-test-users.js

# 3. Run tests (runs against localhost:3000)
npm run test:e2e
```

---

## Deployment

Push to `main` — Vercel auto-deploys. Set the same env vars in your Vercel project settings.

---

> **License:** All Rights Reserved — Confidential  
> © 2026 Bulletin · INTI International University
