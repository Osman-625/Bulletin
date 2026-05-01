# Graph Report - C:/Users/cusma/Projects/Bulletin  (2026-04-25)

## Corpus Check
- Corpus is ~16,977 words - fits in a single context window. You may not need a graph.

## Summary
- 143 nodes · 106 edges · 50 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth and Session|Auth and Session]]
- [[_COMMUNITY_UI Redesign and INTI Branding|UI Redesign and INTI Branding]]
- [[_COMMUNITY_Database Schema and Migration|Database Schema and Migration]]
- [[_COMMUNITY_Announcement Authoring Forms|Announcement Authoring Forms]]
- [[_COMMUNITY_Platform Tech Stack|Platform Tech Stack]]
- [[_COMMUNITY_Dashboard UI Components|Dashboard UI Components]]
- [[_COMMUNITY_Announcement Card Display|Announcement Card Display]]
- [[_COMMUNITY_Middleware and Routing|Middleware and Routing]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_not-found.tsx|not-found.tsx]]
- [[_COMMUNITY_providers.tsx|providers.tsx]]
- [[_COMMUNITY_error.tsx|error.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_error.tsx|error.tsx]]
- [[_COMMUNITY_loading.tsx|loading.tsx]]
- [[_COMMUNITY_error.tsx|error.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_loading.tsx|loading.tsx]]
- [[_COMMUNITY_CategoryFilter.tsx|CategoryFilter.tsx]]
- [[_COMMUNITY_GlassCard.tsx|GlassCard.tsx]]
- [[_COMMUNITY_StatusBadge.tsx|StatusBadge.tsx]]
- [[_COMMUNITY_ThemeToggle.tsx|ThemeToggle.tsx]]
- [[_COMMUNITY_Header.tsx|Header.tsx]]
- [[_COMMUNITY_cn()|cn()]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_client.ts|client.ts]]
- [[_COMMUNITY_AnnouncementWithRelations Type|AnnouncementWithRelations Type]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_next-env.d.ts|next-env.d.ts]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_DashboardSidebar.tsx|DashboardSidebar.tsx]]
- [[_COMMUNITY_database.types.ts|database.types.ts]]
- [[_COMMUNITY_types.ts|types.ts]]
- [[_COMMUNITY_Phase 0 Scaffold Supabase Verc|Phase 0 Scaffold Supabase Verc]]
- [[_COMMUNITY_Phase 2 Public Feed Detail Pag|Phase 2 Public Feed Detail Pag]]
- [[_COMMUNITY_Announcements DB Schema|Announcements DB Schema]]
- [[_COMMUNITY_CLI-Generated database.types.t|CLI-Generated database.types.t]]
- [[_COMMUNITY_checkpoint-2-foundation Git Ta|checkpoint-2-foundation Git Ta]]
- [[_COMMUNITY_Dark Mode Glacier Color System|Dark Mode Glacier Color System]]
- [[_COMMUNITY_DashboardTopNav Component|DashboardTopNav Component]]
- [[_COMMUNITY_DashboardShell Component|DashboardShell Component]]
- [[_COMMUNITY_Dark INTI Color Token Set|Dark INTI Color Token Set]]
- [[_COMMUNITY_BulletinLogo Placeholder Compo|BulletinLogo Placeholder Compo]]
- [[_COMMUNITY_CategoryFilter Pill Redesign|CategoryFilter Pill Redesign]]
- [[_COMMUNITY_Registration CTA Button|Registration CTA Button]]
- [[_COMMUNITY_Mobile Responsive Design|Mobile Responsive Design]]
- [[_COMMUNITY_prefers-reduced-motion Support|prefers-reduced-motion Support]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 9 edges
2. `Bulletin Platform` - 9 edges
3. `Phase 3 Publisher Dashboard Spec` - 8 edges
4. `Phase 4 UI Redesign Spec` - 8 edges
5. `Architecture Foundation Design Spec` - 7 edges
6. `Phase 4 UI Redesign` - 6 edges
7. `Phase 3 Publisher Dashboard Plan` - 6 edges
8. `Phase 3 Task 6 Create Edit Forms` - 5 edges
9. `Phase 3 Publisher Dashboard` - 4 edges
10. `Migration 20260411000004 fixes.sql` - 4 edges

## Surprising Connections (you probably didn't know these)
- `AdminLayout()` --calls--> `createClient()`  [INFERRED]
  C:\Users\cusma\Projects\Bulletin\src\app\(admin)\layout.tsx → C:\Users\cusma\Projects\Bulletin\src\lib\supabase\server.ts
- `login()` --calls--> `createClient()`  [INFERRED]
  C:\Users\cusma\Projects\Bulletin\src\app\(auth)\login\actions.ts → C:\Users\cusma\Projects\Bulletin\src\lib\supabase\server.ts
- `logout()` --calls--> `createClient()`  [INFERRED]
  C:\Users\cusma\Projects\Bulletin\src\app\(auth)\login\actions.ts → C:\Users\cusma\Projects\Bulletin\src\lib\supabase\server.ts
- `DashboardLayout()` --calls--> `createClient()`  [INFERRED]
  C:\Users\cusma\Projects\Bulletin\src\app\(dashboard)\layout.tsx → C:\Users\cusma\Projects\Bulletin\src\lib\supabase\server.ts
- `DashboardPage()` --calls--> `createClient()`  [INFERRED]
  C:\Users\cusma\Projects\Bulletin\src\app\(dashboard)\dashboard\page.tsx → C:\Users\cusma\Projects\Bulletin\src\lib\supabase\server.ts

## Communities

### Community 0 - "Auth and Session"
Cohesion: 0.13
Nodes (10): login(), logout(), getActiveCategories(), getAnnouncementById(), getPublicAnnouncements(), AdminLayout(), DashboardLayout(), DashboardPage() (+2 more)

### Community 1 - "UI Redesign and INTI Branding"
Cohesion: 0.15
Nodes (16): AI Draft Feature (Server Action), INTI Brand Colors, Phase 4 UI Redesign, react-markdown Dependency, Phase 4 Typography Playfair Display DM Sans, Geist and Geist Mono Fonts, Light Mode INTI Red Color System, Accessibility WCAG AA (+8 more)

### Community 2 - "Database Schema and Migration"
Cohesion: 0.15
Nodes (13): Audit Log Table, Auth Trigger handle_new_user, Invitations Table, Migration 20260411000004 fixes.sql, Architecture Foundation Implementation Plan, Publisher RLS WITH CHECK Fix, (auth) Route Group, (dashboard) Route Group (+5 more)

### Community 3 - "Announcement Authoring Forms"
Cohesion: 0.17
Nodes (12): ActionBar Component, AnnouncementForm Component, AutosaveIndicator Component, Phase 3 Publisher Dashboard, Announcement Server Actions, Phase 3 Task 6 Create Edit Forms, Phase 3 Task 7 Animations Polish, Announcements List Page (+4 more)

### Community 4 - "Platform Tech Stack"
Cohesion: 0.22
Nodes (10): (admin) Route Group, Bulletin Platform, INTI International University, Next.js 15 (App Router + TypeScript), Admin Role, Public Role (unauthenticated), Super Admin Role, Supabase (PostgreSQL + RLS + Auth + Storage) (+2 more)

### Community 5 - "Dashboard UI Components"
Cohesion: 0.32
Nodes (8): AnnouncementRow Component, DashboardSidebar Component, FAB Floating Action Button, Glacier OS Dark Aesthetic, GlassCard Component, StatusBadge Component, ThemeToggle Component, Phase 3 Publisher Dashboard Spec

### Community 6 - "Announcement Card Display"
Cohesion: 0.67
Nodes (0): 

### Community 7 - "Middleware and Routing"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "not-found.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "providers.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "error.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "error.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "loading.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "error.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "layout.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "loading.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "CategoryFilter.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "GlassCard.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "StatusBadge.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "ThemeToggle.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Header.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "cn()"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "utils.ts"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "client.ts"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "AnnouncementWithRelations Type"
Cohesion: 1.0
Nodes (2): AnnouncementWithRelations Type, types.ts Composition Layer

### Community 27 - "eslint.config.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "next-env.d.ts"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "next.config.ts"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "postcss.config.mjs"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "DashboardSidebar.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "database.types.ts"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "types.ts"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Phase 0 Scaffold Supabase Verc"
Cohesion: 1.0
Nodes (1): Phase 0 Scaffold Supabase Vercel

### Community 37 - "Phase 2 Public Feed Detail Pag"
Cohesion: 1.0
Nodes (1): Phase 2 Public Feed Detail Page

### Community 38 - "Announcements DB Schema"
Cohesion: 1.0
Nodes (1): Announcements DB Schema

### Community 39 - "CLI-Generated database.types.t"
Cohesion: 1.0
Nodes (1): CLI-Generated database.types.ts

### Community 40 - "checkpoint-2-foundation Git Ta"
Cohesion: 1.0
Nodes (1): checkpoint-2-foundation Git Tag

### Community 41 - "Dark Mode Glacier Color System"
Cohesion: 1.0
Nodes (1): Dark Mode Glacier Color System

### Community 42 - "DashboardTopNav Component"
Cohesion: 1.0
Nodes (1): DashboardTopNav Component

### Community 43 - "DashboardShell Component"
Cohesion: 1.0
Nodes (1): DashboardShell Component

### Community 44 - "Dark INTI Color Token Set"
Cohesion: 1.0
Nodes (1): Dark INTI Color Token Set

### Community 45 - "BulletinLogo Placeholder Compo"
Cohesion: 1.0
Nodes (1): BulletinLogo Placeholder Component

### Community 46 - "CategoryFilter Pill Redesign"
Cohesion: 1.0
Nodes (1): CategoryFilter Pill Redesign

### Community 47 - "Registration CTA Button"
Cohesion: 1.0
Nodes (1): Registration CTA Button

### Community 48 - "Mobile Responsive Design"
Cohesion: 1.0
Nodes (1): Mobile Responsive Design

### Community 49 - "prefers-reduced-motion Support"
Cohesion: 1.0
Nodes (1): prefers-reduced-motion Support

## Knowledge Gaps
- **49 isolated node(s):** `Next.js 15 (App Router + TypeScript)`, `Tailwind CSS + shadcn/ui`, `Supabase (PostgreSQL + RLS + Auth + Storage)`, `Vercel Hosting`, `Public Role (unauthenticated)` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Middleware and Routing`** (2 nodes): `middleware.ts`, `middleware()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `not-found.tsx`** (2 nodes): `not-found.tsx`, `NotFound()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `providers.tsx`** (2 nodes): `providers.tsx`, `Providers()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `error.tsx`** (2 nodes): `error.tsx`, `AuthError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `AuthLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `error.tsx`** (2 nodes): `error.tsx`, `DashboardError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `loading.tsx`** (2 nodes): `loading.tsx`, `DashboardLoading()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `error.tsx`** (2 nodes): `error.tsx`, `PublicError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `layout.tsx`** (2 nodes): `layout.tsx`, `PublicLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `loading.tsx`** (2 nodes): `loading.tsx`, `PublicLoading()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CategoryFilter.tsx`** (2 nodes): `CategoryFilter.tsx`, `CategoryFilter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GlassCard.tsx`** (2 nodes): `GlassCard.tsx`, `GlassCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `StatusBadge.tsx`** (2 nodes): `StatusBadge.tsx`, `StatusBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ThemeToggle.tsx`** (2 nodes): `ThemeToggle.tsx`, `ThemeToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Header.tsx`** (2 nodes): `Header.tsx`, `Header()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `cn()`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `utils.ts`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `client.ts`** (2 nodes): `client.ts`, `createClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AnnouncementWithRelations Type`** (2 nodes): `AnnouncementWithRelations Type`, `types.ts Composition Layer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `eslint.config.mjs`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `next-env.d.ts`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `next.config.ts`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `postcss.config.mjs`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DashboardSidebar.tsx`** (1 nodes): `DashboardSidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `database.types.ts`** (1 nodes): `database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `types.ts`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phase 0 Scaffold Supabase Verc`** (1 nodes): `Phase 0 Scaffold Supabase Vercel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phase 2 Public Feed Detail Pag`** (1 nodes): `Phase 2 Public Feed Detail Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Announcements DB Schema`** (1 nodes): `Announcements DB Schema`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CLI-Generated database.types.t`** (1 nodes): `CLI-Generated database.types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `checkpoint-2-foundation Git Ta`** (1 nodes): `checkpoint-2-foundation Git Tag`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dark Mode Glacier Color System`** (1 nodes): `Dark Mode Glacier Color System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DashboardTopNav Component`** (1 nodes): `DashboardTopNav Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DashboardShell Component`** (1 nodes): `DashboardShell Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dark INTI Color Token Set`** (1 nodes): `Dark INTI Color Token Set`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `BulletinLogo Placeholder Compo`** (1 nodes): `BulletinLogo Placeholder Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CategoryFilter Pill Redesign`** (1 nodes): `CategoryFilter Pill Redesign`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Registration CTA Button`** (1 nodes): `Registration CTA Button`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobile Responsive Design`** (1 nodes): `Mobile Responsive Design`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `prefers-reduced-motion Support`** (1 nodes): `prefers-reduced-motion Support`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 3 Publisher Dashboard` connect `Announcement Authoring Forms` to `UI Redesign and INTI Branding`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Phase 4 UI Redesign` connect `UI Redesign and INTI Branding` to `Announcement Authoring Forms`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Phase 3 Publisher Dashboard Plan` connect `Announcement Authoring Forms` to `Dashboard UI Components`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `createClient()` (e.g. with `AdminLayout()` and `login()`) actually correct?**
  _`createClient()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Next.js 15 (App Router + TypeScript)`, `Tailwind CSS + shadcn/ui`, `Supabase (PostgreSQL + RLS + Auth + Storage)` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth and Session` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._