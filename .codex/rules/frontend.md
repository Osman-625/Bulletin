---
paths:
  - 'src/app/**/*.tsx'
  - 'src/components/**/*.tsx'
  - 'src/app/globals.css'
---

# Frontend

## Required Reads

- Read `src/app/globals.css` before changing colors, spacing, typography, radius, shadow, or animation.
- Read the relevant Next.js 16 docs in `node_modules/next/dist/docs/` before using framework APIs.

## Future Commons Direction

- Warm, official, alive.
- Editorial campus board, not SaaS and not social media.
- Public feed uses dense bento layouts.
- Dashboard uses `DashboardShell`, `DashboardSidebar`, and `DashboardTopNav`.

## Tokens

- Use CSS custom properties from `globals.css`.
- Do not hard-code hex, rgb, hsl, arbitrary shadows, or one-off spacing in components when a token exists.
- Use `font-display`, `font-sans`, and `font-mono` as defined by the project.

## Stack

- CSS: Tailwind CSS v4.
- UI primitives: local components plus shadcn/Radix patterns when already present.
- Icons: `lucide-react`.
- Motion: existing CSS/Tailwind animation primitives and `tw-animate-css`.

## Accessibility

- Mobile-first.
- Touch targets must be at least 44px.
- Body text contrast must meet WCAG AA.
- Interactive elements must be keyboard accessible with visible focus states.
- Images need useful `alt`; decorative images use `alt=""`.
- Respect `prefers-reduced-motion`.

## Layout

- Use CSS Grid for two-dimensional layouts and Flexbox for one-dimensional layouts.
- Use `gap` rather than margin chains.
- Do not put cards inside cards.
- Keep page sections as full-width bands or unframed constrained layouts.
