# Bulletin Design System

Date: 2026-05-14  
Selected direction: **Future Commons**

This file is the production design-system brief for Bulletin. It turns the brand exploration into implementation rules for the public feed, announcement detail pages, publisher dashboard, admin review surfaces, and design assets.

## Brand Position

Bulletin is a modern campus announcement platform for INTI International University students and staff. It should feel credible inside the university ecosystem, but it must have its own product identity.

The brand promise:

> Official campus communication that feels readable, warm, and worth checking every day.

Three brand words:

- Warm
- Official
- Alive

Anti-references:

- Generic SaaS dashboards
- Neon AI gradients
- Cropped poster thumbnails
- Dated portal tables
- Social-media feed casualness

## Identity System

### Logo And Marks

Primary production mark:

- `public/bulletin_logo.png` remains the current application mark.

Brand-lab companion marks:

- `public/brand-lab/campus-press-mark.svg`
- `public/brand-lab/signal-atlas-mark.svg`
- `public/brand-lab/future-commons-mark.svg`

Usage rules:

- Do not copy, redraw, or approximate the official INTI logo.
- Use the companion marks as Bulletin-owned campaign/system assets.
- The INTI relationship should be carried by copy, color discipline, and academic hierarchy.

### Motifs

Future Commons motifs:

- Compass-star navigation
- Soft signal arcs
- Warm board grid
- Registration marks
- Poster mats
- Category swatches

Use motifs sparingly. The announcement remains the product.

## Color System

### Light Mode

| Token                      | Value                     | Role                               |
| -------------------------- | ------------------------- | ---------------------------------- |
| `--color-canvas`           | `#F8F2DF`                 | Page canvas                        |
| `--color-surface`          | `#FFFAF0`                 | Main card and panel surface        |
| `--color-surface-elevated` | `#F2EAD8`                 | Poster mats, raised cells          |
| `--color-surface-high`     | `#E7DDC9`                 | Skeletons and active neutral areas |
| `--color-border`           | `#E2D3BD`                 | Default border                     |
| `--color-text-primary`     | `#241815`                 | Main text                          |
| `--color-text-secondary`   | `#4A3933`                 | Secondary text                     |
| `--color-text-muted`       | `#705F52`                 | Metadata                           |
| `--color-accent-inti`      | `#C8102E`                 | Primary action, urgency, authority |
| `--color-accent-hover`     | `#A80D24`                 | Primary hover                      |
| `--color-accent-surface`   | `rgba(200, 16, 46, 0.08)` | Red-tinted surface                 |
| `--color-navy`             | `#143A5F`                 | Institutional support              |
| `--color-gold`             | `#D4941F`                 | Dates, deadlines, issue metadata   |

### Dark Mode

| Token                      | Value     | Role                        |
| -------------------------- | --------- | --------------------------- |
| `--color-canvas`           | `#15110F` | Page canvas                 |
| `--color-surface`          | `#211A17` | Main card and panel surface |
| `--color-surface-elevated` | `#2C241F` | Raised cells                |
| `--color-border`           | `#40352D` | Default border              |
| `--color-text-primary`     | `#EDE8E3` | Main text                   |
| `--color-text-secondary`   | `#BFB3AC` | Secondary text              |
| `--color-text-muted`       | `#978A83` | Metadata                    |
| `--color-accent-inti`      | `#E8203A` | Dark-mode red signal        |
| `--color-gold`             | `#F5A623` | Dates and deadlines         |
| `--color-navy`             | `#7FB2E7` | Dark-mode support accent    |

Color rules:

- Red is not decoration. Use it for primary actions, urgency, and official markers.
- Gold is not a second primary action. Use it for dates, deadlines, issue numbers, and high-value metadata.
- Navy supports authority and depth, especially in dashboard and footer contexts.
- Avoid pure white and pure black.
- Do not place low-contrast muted text on colored surfaces.

## Typography

Production pairing:

- Display: **Bricolage Grotesque**
- Body: **Atkinson Hyperlegible**
- Label accent: **Faculty Glyphic** where available, otherwise `Geist Mono` for technical metadata

Rules:

- Display headings should feel warm and editorial.
- Body text must prioritize readability for students scanning quickly.
- Labels should be short and high contrast.
- Do not use all caps for long strings.
- Keep announcement body line length near 65-75 characters.

Suggested scale:

| Role          | Size                         |
| ------------- | ---------------------------- |
| Hero display  | `clamp(3rem, 7vw, 6.75rem)`  |
| Page title    | `clamp(2.4rem, 5vw, 4.5rem)` |
| Section title | `1.75rem` to `2.25rem`       |
| Card title    | `1.25rem` to `2rem`          |
| Body          | `1rem`                       |
| Metadata      | `0.75rem` to `0.875rem`      |

## Layout System

Spacing scale:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `48`
- `64`
- `96`

Grid rules:

- Desktop public feed: featured announcement plus modular poster grid.
- Desktop dashboard: sidebar plus dense workspace cells.
- Tablet: two-column feed where possible, single-column forms where needed.
- Mobile: single-column, poster-first, no hidden critical actions.

Surface rules:

- Cards use modest radius, 8-12px preferred.
- Do not nest cards inside cards.
- Use full borders and surface contrast instead of side accent stripes.
- Posters should be framed as artifacts, not background decoration.

## Component Language

### Navigation

- Warm official masthead
- Red primary workspace action
- Clear theme switch
- Thin brand rule may use red/gold/red
- Avoid oversized marketing nav

### Announcement Cards

- Poster area uses `object-contain`
- Metadata reads before excerpt
- Category chip includes color swatch
- Urgency appears as text plus surface state, not only color
- Hover lifts slightly and clarifies border color

### Filters

- Segmented controls for category and status
- Pressed state must be explicit with `aria-pressed`
- Mobile filters should wrap cleanly without horizontal overflow

### Forms

- Form groups: content, audience, schedule, presentation, proof
- Preview should sit near content controls on desktop
- Validation should be direct and specific

### Dashboard

- Quiet, dense, work-focused
- Review queue and publishing health first
- Analytics should support decisions, not decorate
- Use status badges consistently across publisher/admin/owner roles

## Motion System

Motion personality:

- Friendly
- Quick
- Settled

Timing:

- Control hover/press: 180-220ms
- Card hover: 220-280ms
- Page/module entrance: 420-520ms
- Drawer/mobile nav: 260-320ms

Easing:

- Use `cubic-bezier(0.16, 1, 0.3, 1)` for most UI transitions.
- Avoid bounce and elastic easing.

Required moments:

- Page load stagger for major feed modules
- Filter confirmation
- Theme switch state
- Loading skeleton shimmer
- Form autosave/publish feedback

Reduced motion:

- Preserve state changes with opacity and color.
- Remove translate/scale motion.
- Keep focus rings visible.

## Accessibility

Baseline:

- WCAG AA contrast minimum
- Visible keyboard focus
- Hit targets near 44px where possible
- Reduced-motion support
- Text alternatives for meaningful images
- Posters with text should still have announcement titles/excerpts in HTML

Announcement posters:

- Never rely on poster text alone.
- Store title, date, category, organization, and excerpt as accessible text.

## Final Implementation Plan

### Phase 1: Token Stabilization

- Keep Future Commons as the root token set in `src/app/globals.css`.
- Add explicit semantic tokens for poster mats, category chips, issue metadata, and dashboard cells.
- Audit hard-coded colors and replace with tokens.

### Phase 2: Public Feed

- Refine the homepage into a poster-native commons board.
- Preserve poster aspect ratio with `object-contain`.
- Add clearer featured/secondary hierarchy.
- Make category and urgency readable in under two seconds.
- Verify mobile text wrapping and filter behavior.

### Phase 3: Announcement Detail

- Build a strong poster/detail split on desktop.
- Keep detail pages readable on mobile.
- Add official metadata block: organization, category, dates, urgency, registration link.
- Add branded loading state and empty/error states.

### Phase 4: Publisher Dashboard

- Rework dashboard panels around publish health, drafts, submitted reviews, and expiring posts.
- Use warm operational cells instead of generic SaaS cards.
- Add consistent status badges and queue hierarchy.

### Phase 5: Admin Review

- Align review pages with the same editorial workflow.
- Make approval/rejection actions visually distinct and accessible.
- Surface poster quality warnings and schedule conflicts.

### Phase 6: Motion And Polish

- Add page/module entry sequencing.
- Refine hover/press states.
- Ensure `prefers-reduced-motion` behavior is complete.
- Run visual checks across desktop and mobile.

### Phase 7: Design Asset Package

- Keep the three brand-lab marks in `public/brand-lab`.
- Export color and type tokens from a single typed source if the system grows.
- Use `/brand-lab` for stakeholder comparison and future direction reviews.

## Acceptance Criteria

- The product feels at home in INTI's ecosystem without copying INTI assets.
- Students can identify urgency, category, and recency quickly.
- Posters are readable and never cropped by default.
- Dashboard surfaces feel operational, not decorative.
- Light and dark modes share the same brand logic.
- Reduced motion remains clear.
- The UI does not resemble a generic SaaS template.
