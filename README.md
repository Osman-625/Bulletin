# Bulletin

> Centralized university announcement platform for INTI International University

A public-facing web platform that consolidates scattered university announcements — WhatsApp groups, Instagram, email chains, and physical noticeboards — into a single broadcast hub.

## Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| Frontend + Backend | Next.js 15 (App Router) + TypeScript |
| Styling            | Tailwind CSS + shadcn/ui             |
| Database           | Supabase (PostgreSQL + RLS)          |
| Auth               | Supabase Auth                        |
| Storage            | Supabase Storage                     |
| Hosting            | Vercel                               |

## Roles

| Role        | Description                               |
| ----------- | ----------------------------------------- |
| Super Admin | Platform owner — full control             |
| Admin       | SA Director / Student Council President   |
| Publisher   | Approved clubs and departments            |
| Public      | Students and visitors (no account needed) |

## Getting Started

### Prerequisites

- Node.js 18+ (via nvm recommended)
- A Supabase project
- A Vercel account

### Local Setup

```bash
# Clone the repo
git clone https://github.com/Osman6202/Bulletin.git
cd Bulletin

# Install dependencies
npm install

# Copy env template and fill in your Supabase keys
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public feed — no auth required
│   ├── (auth)/            # Login for publishers/admins
│   ├── dashboard/         # Publisher dashboard
│   └── admin/             # Admin dashboard
├── components/
│   ├── announcements/
│   ├── dashboard/
│   └── ui/                # shadcn/ui components
├── lib/
│   └── supabase/          # Supabase client helpers
└── types/
supabase/
└── migrations/            # Database schema SQL files
```

## Development Progress

Tracked in Google Drive → Bulletin → \_Tracker → PROGRESS sheet.

---

> **License:** All Rights Reserved — Confidential  
> © 2025 Bulletin
