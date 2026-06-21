# Announcement Card Standardization Design

**Date:** 2026-06-21  
**Status:** Approved for implementation

## Objective

Refactor every public announcement card to use the same ordered, reusable slot components. Content length and optional values must not change slot positions or card height. Image and no-image cards may use different fixed height contracts, but cards of the same type must be identical in structure and size.

## Scope

This change is limited to `src/components/announcements/AnnouncementCard.tsx`, its announcement-card rules in `src/app/globals.css`, loading-card parity where required, and focused tests. It preserves announcement queries, public/private visibility, filtering, sorting, pagination, urgency calculations, URLs, image URL validation, date formatting, and the three-column public board.

## Current Failure

- **File / component:** `src/components/announcements/AnnouncementCard.tsx`, `StandardCard` and `FeaturedCard`.
- **Cause:** Both variants duplicate their body markup and conditionally omit the badge row and metadata boxes. Title, description, metadata, and footer spacing also vary between variants and according to content.
- **Visible failure:** Cards shift internally when badges, dates, deadlines, descriptions, or images differ. Image and featured cards do not share the same body rhythm as no-image cards.
- **Exact fix:** Replace the duplicated bodies with one ordered slot pipeline composed from `CardImage`, `StatusBadge`, `CardTitle`, `CardDescription`, `CardMetaInfo`, and `CardFooter`. Give each slot an explicit CSS grid row and reserved block size.
- **Test step:** Render or inspect cards with long/short titles, long/missing descriptions, missing deadlines, multiple badges, and image/no-image data. Confirm equal slot coordinates within each card type and unchanged board ordering.

## Component Architecture

`AnnouncementCard` remains the public entry point. It derives the existing presentation values once, determines whether an image exists, and applies the type contract `image` or `text`. The `featured` prop may alter outer emphasis and image treatment, but it must not create a separate content-body implementation.

Every card renders the following ordered slots:

1. `CardImage` — rendered only when a safe image URL exists. It owns one fixed media slot, crop, frame, radius, and object-fit contract.
2. `StatusBadge` — always rendered. It preserves current urgency, pinned, category, registration, expiration, and feature labels. When empty, it remains present and hidden from assistive technology while reserving the same space.
3. `CardTitle` — always rendered in a fixed two-line slot with one standardized size, weight, and line height. Overflow is clamped. The stored publisher display-size preference remains unchanged in data but no longer changes public-card geometry.
4. `CardDescription` — always rendered in a fixed-height slot. Existing fallback copy is preserved for missing body content. Image and text cards may use different fixed clamp counts, but all cards of the same type use the same count and height.
5. `CardMetaInfo` — always renders equal-width `Posted` and `Deadline` boxes. Missing values use a stable display fallback rather than removing a box.
6. `CardFooter` — always renders the publisher/source at left and `Read details` at right in the final fixed row.

The full-card link remains an overlay with the existing accessible title association and focus ring. Slot content stays above the overlay, and no new interactive elements are introduced inside it.

## Layout Contract

The card body uses CSS Grid rather than flexible distribution. Its template has explicit rows for status, title, description, metadata, and footer, with fixed gaps from shared announcement-card custom properties. No slot uses content-driven expansion.

The public board keeps its current fixed grid row spans and dense/ordered flow behavior. The card itself does not use masonry or content-dependent sizing. Existing image-card and text-card board spans remain the external height contract; matching CSS variables define their internal slot dimensions at supported breakpoints.

The two metadata boxes use a two-column grid at every card width, identical height, and aligned edges. Text truncates instead of resizing a box. The footer occupies the last row without `margin-top: auto` or content-sensitive flex behavior.

## Variants

- **Image card:** Adds the fixed `CardImage` row. All image cards use the same media height and body slot structure.
- **No-image card:** Omits only the image row. It keeps the same body slot order and alignment and uses the standardized text-card height.
- **Featured card:** Uses the same slot components and body grid. Feature styling is limited to outer chrome, feature status content, and image decoration; it cannot fork title, description, metadata, or footer markup.

## Data and Behavior

No data-access function or public-board selection logic changes. Existing helpers remain authoritative for Malaysia time, deadline labels, urgency, safe links, safe image URLs, display-font normalization, and announcement paths. The stored `display_size` value is not mutated; the standardized public card title intentionally stops using it because variable title sizing conflicts with the fixed-slot requirement. The refactor only maps existing data into reusable presentational slots.

## Accessibility

- Preserve `article`, `aria-labelledby`, and the full-card link's screen-reader label.
- Empty reserved slots must not announce meaningless placeholders.
- Visible missing metadata uses concise labels such as `No deadline`; it is not represented by an unlabeled blank box.
- Title and description clamping must not change the accessible source text.
- Focus indication and minimum usable pointer target remain unchanged.

## Testing Strategy

1. Add a failing source/component contract test that requires every named slot component and verifies their order in the shared card body.
2. Require unconditional rendering of status and metadata slots, including both metadata boxes.
3. Require fixed CSS grid rows, title and description clamps, equal metadata columns, and type-specific card/media sizing.
4. Update existing public-feed source guards only where old duplicated markup is intentionally removed.
5. Run focused Vitest tests, TypeScript, lint, the production build, and React Doctor's diff scan.
6. Verify the rendered public page at mobile and desktop widths when the browser surface is available, comparing image and no-image slot positions without changing the three-column board.

## Non-Goals

- No changes to announcement content or publisher fields.
- No changes to data fetching, RLS, authentication, filtering, sorting, pagination, or featured selection.
- No redesign of the public page or pinned-notice side panel.
- No new card interaction, animation, or dependency.
