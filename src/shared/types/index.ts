import type { Tables, Enums } from '@/infrastructure/database/database.types'

// ─── Row types ───────────────────────────────────────────────

export type DbAnnouncement = Tables<'announcements'>
export type DbCategory = Tables<'categories'>
export type DbOrganization = Tables<'organizations'>
export type DbUser = Tables<'users'>
export type DbNotification = Tables<'notifications'>

// ─── Enum types ──────────────────────────────────────────────

export type PostStatus = Enums<'post_status'>
export type UserRole = Enums<'user_role'>
export type OrgMemberRole = Enums<'org_member_role'>

// ─── Relation types ──────────────────────────────────────────

export type AnnouncementWithRelations = DbAnnouncement & {
  categories: Pick<DbCategory, 'id' | 'name' | 'slug' | 'color'> | null
  organizations: Pick<DbOrganization, 'id' | 'name' | 'slug' | 'logo_url'> | null
}

export type PublicAnnouncement = Pick<
  DbAnnouncement,
  | 'id'
  | 'title'
  | 'body'
  | 'banner_url'
  | 'urgency'
  | 'display_font'
  | 'display_size'
  | 'registration_link'
  | 'scheduled_publish_at'
  | 'pinned_until'
  | 'published_at'
  | 'expires_at'
> & {
  categories: Pick<DbCategory, 'id' | 'name' | 'slug' | 'color'> | null
  organizations: Pick<DbOrganization, 'id' | 'name' | 'slug' | 'logo_url'> | null
}

export type PublicAnnouncementDetail = PublicAnnouncement & Pick<DbAnnouncement, 'organization_id'>

export type AnnouncementForReview = DbAnnouncement & {
  categories: Pick<DbCategory, 'name' | 'slug' | 'color'> | null
  organizations: Pick<DbOrganization, 'name' | 'slug'> | null
  users: Pick<DbUser, 'display_name' | 'email'> | null
}

export type OrgWithOwner = DbOrganization & {
  owner: Pick<DbUser, 'display_name' | 'email'> | null
}

export type PublisherWithOrgs = DbUser & {
  organization_members: {
    organization_id: string
    member_role: OrgMemberRole
    organizations: Pick<DbOrganization, 'name' | 'slug'>
  }[]
}
