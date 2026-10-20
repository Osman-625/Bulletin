// One column list per table, shared by every select that is cast to the full row type, so the
// select can't drift from its type. tests/unit/database/select-columns.test.ts checks them.

export const USER_PROFILE_COLUMNS =
  'id, email, display_name, role, avatar_url, force_password_change, created_at, updated_at' as const

export const ORGANIZATION_COLUMNS =
  'id, name, slug, description, logo_url, status, org_type, owner_id, approved_by, approved_at, created_at, updated_at' as const

export const NOTIFICATION_COLUMNS =
  'id, recipient_id, actor_id, announcement_id, type, title, body, href, read_at, created_at' as const

export const ANNOUNCEMENT_REVIEW_COLUMNS =
  'id, title, body, banner_url, status, urgency, display_font, display_size, category_id, organization_id, author_id, registration_link, rejection_comment, scheduled_publish_at, pinned_until, view_count, published_at, expires_at, archived_at, created_at, updated_at' as const
