# Announcement Card Standardization Design

**Date:** 2026-06-21
**Status:** Ready for implementation

## Objective

Refactor every public announcement card into a standardized slot-based component structure.

Content length, optional values, badge count, missing metadata, and image availability must not change internal slot positions or card height. Image cards and no-image cards may use different fixed height contracts, but cards of the same type must be identical in structure, spacing, and size.

## Scope

This change is limited to:

- `src/components/announcements/AnnouncementCard.tsx`
- Announcement-card CSS rules in `src/app/globals.css`
- Loading-card parity where required
- Focused source/component tests and layout tests

This refactor must preserve:

- Announcement queries
- Public/private visibility rules
- Filtering, sorting, and pagination
- Urgency and deadline calculations
- URL handling
- Image URL validation
- Date formatting
- Current public board ordering
- Current three-column public board structure

No data-access logic or public-board selection logic should change.

## Current Failure

- **File / component:** `src/components/announcements/AnnouncementCard.tsx`, specifically `StandardCard` and `FeaturedCard`.
- **Cause:** Both variants duplicate their body markup and conditionally omit badge rows, metadata boxes, and spacing blocks. Title, description, metadata, and footer spacing also vary by content length, image availability, and variant type.
- **Visible failure:** Cards shift internally when badges, dates, deadlines, descriptions, or images differ. Image cards, no-image cards, and featured cards do not share the same body rhythm.
- **Exact fix:** Replace duplicated card bodies with one ordered slot pipeline built from reusable components:
  - `CardImage`
  - `StatusBadge`
  - `CardTitle`
  - `CardDescription`
  - `CardMetaInfo`
  - `CardFooter`

Each slot must have an explicit CSS grid row and reserved block size.

## Component Architecture

`AnnouncementCard` remains the public entry point.

It should derive the existing presentation values once, determine whether a safe image exists, and apply one of two card type contracts:

- `image`
- `text`

The `featured` prop may change outer emphasis, feature badge content, and image decoration. It must not create a separate content-body implementation.

Every card renders the same shared body slots. Image cards additionally render `CardImage` above the shared body.

### 1. `CardImage`

Rendered only when a safe image URL exists.

Responsibilities:

- Own the fixed media slot
- Apply the image crop
- Apply the frame
- Apply the radius
- Apply the `object-fit` contract

All image cards must use the same image slot dimensions at each supported breakpoint.

### 2. `StatusBadge`

Always rendered.

Responsibilities:

- Render urgency, pinned, category, registration, expiration, and feature labels inside one reserved status row
- Keep the status row at a fixed height
- Prevent badges from wrapping into extra rows
- Apply the existing badge priority order when multiple badges exist
- Cap visible badges or truncate overflow safely when needed
- Reserve the same space when no badge exists

When empty, the slot remains present but should be hidden from assistive technology so it does not announce meaningless content.

### 3. `CardTitle`

Always rendered.

Responsibilities:

- Render the announcement title in a fixed-height title slot
- Use a fixed line count per card type
- Clamp overflow
- Keep the same font size, weight, and line height for cards of the same type

Text cards and image cards may define different title clamp counts, but cards of the same type must use the same count and height.

The stored `display_size` value must not change public-card geometry. If it is still visually applied, it must stay within the fixed title slot and must not alter row height, line count, or card size. If that cannot be done safely, public cards should use the standardized title size while preserving `display_size` in data.

### 4. `CardDescription`

Always rendered.

Responsibilities:

- Render the announcement description in a fixed-height description slot
- Preserve the existing fallback copy for missing body content
- Clamp overflow
- Keep a consistent line count and height for cards of the same type

Image cards and text cards may use different description clamp counts, but all cards of the same type must use the same count and height.

### 5. `CardMetaInfo`

Always rendered.

Responsibilities:

- Render equal-width `Posted` and `Deadline` boxes
- Keep both boxes visible
- Keep both boxes the same height
- Align both boxes to the same edges
- Use stable display fallbacks for missing values

Missing metadata must not remove a metadata box. Use concise visible fallback text such as `No deadline`.

### 6. `CardFooter`

Always rendered.

Responsibilities:

- Render publisher/source text on the left
- Render `Read details` text on the right
- Stay in the final fixed row
- Truncate long publisher or action text if needed

The footer must not use `margin-top: auto` or any content-sensitive spacing behavior.

## Link Behavior

The full-card link remains an overlay with the existing accessible title association and focus ring.

Rules:

- Do not create nested anchor elements.
- If the full-card overlay remains the only link, `Read details` is visual text inside the card, not a second link.
- Slot content stays above the overlay visually.
- No new interactive elements should be introduced inside the card.

## Layout Contract

The shared card body uses CSS Grid.

The grid template must define explicit rows for:

1. Status
2. Title
3. Description
4. Metadata
5. Footer

Spacing must come from shared announcement-card custom properties. No slot may expand because of content height.

The public board keeps its current fixed grid row spans and current dense or ordered flow behavior. The card itself must not use masonry behavior or content-dependent sizing.

Existing image-card and text-card board spans remain the external height contract. Matching CSS variables should define internal slot dimensions at supported breakpoints.

The metadata section uses a two-column grid at every card width. Both boxes must keep identical height and aligned edges. Text truncates inside the boxes instead of resizing them.

## Overflow Rules

- Badge row: fixed height, no wrapping into additional rows.
- Title: fixed line count, clamp overflow.
- Description: fixed line count, clamp overflow.
- Metadata: fixed height, text truncates inside boxes.
- Footer: fixed height, publisher and action text truncate if needed.
- No slot may use content height to expand the card.

## Variants

### Image Card

Adds the fixed `CardImage` row above the shared body.

All image cards must use:

- The same media height
- The same body slot order
- The same body grid
- The same internal spacing
- The same card height contract

### No-Image Card

Omits only the image row.

All no-image cards must use:

- The same body slot order
- The same body grid
- The same internal spacing
- The same text-card height contract

### Featured Card

Uses the same slot components and shared body grid.

Feature styling may affect:

- Outer card chrome
- Feature-related status content
- Image decoration

Feature styling must not fork the title, description, metadata, or footer markup.

## Data and Behavior

No data-access function or public-board selection logic changes.

Existing helpers remain the source of truth for:

- Malaysia time
- Deadline labels
- Urgency calculations
- Safe links
- Safe image URLs
- Display-font normalization
- Announcement paths

The stored `display_size` value is not mutated. Public card geometry must remain standardized regardless of this value.

This refactor only maps existing announcement data into reusable presentational slots.

## Accessibility

Preserve the existing accessibility behavior:

- Keep `article`
- Keep `aria-labelledby`
- Keep the full-card link screen-reader label
- Keep the current focus indication
- Keep minimum usable pointer target behavior

Additional rules:

- Empty reserved slots must not announce meaningless placeholders.
- Missing metadata should use concise visible fallback text, such as `No deadline`.
- Title and description clamping must not change the accessible source text.
- The visual `Read details` text must not create a nested link.

## Testing Strategy

1. Add a failing source/component contract test that requires every named slot component.
2. Verify the slot order in the shared card body.
3. Require unconditional rendering of the status slot and metadata slot.
4. Require both metadata boxes to render in every card.
5. Require fixed CSS grid rows for the shared body.
6. Require title and description clamps.
7. Require equal metadata columns.
8. Require type-specific card sizing and media sizing.
9. Update existing public-feed source guards only where old duplicated markup is intentionally removed.
10. Run focused Vitest tests.
11. Run TypeScript.
12. Run lint.
13. Run the production build.
14. Run React Doctor's diff scan.
15. When browser rendering is available, verify the public page at mobile and desktop widths.
16. Compare image and no-image slot positions without changing the three-column board.

## Verification Cases

Test or inspect cards with:

- Long titles
- Short titles
- Long descriptions
- Missing descriptions
- Missing deadlines
- Multiple badges
- No badges
- Image data
- No-image data
- Featured cards
- Standard cards

Expected result:

- Cards of the same type have equal internal slot coordinates.
- Cards of the same type have equal height.
- Missing optional data does not shift layout.
- Long content is clamped or truncated.
- Board ordering remains unchanged.
- The public board remains a three-column announcement board.

## Non-Goals

- No changes to announcement content.
- No changes to publisher fields.
- No changes to data fetching.
- No changes to RLS.
- No changes to authentication.
- No changes to filtering, sorting, or pagination.
- No changes to featured selection.
- No redesign of the public page.
- No redesign of the pinned-notice side panel.
- No new card interaction.
- No new animation.
- No new dependency.
