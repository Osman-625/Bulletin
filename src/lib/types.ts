import type { Tables, Enums } from './database.types'

// ─── Row types ───────────────────────────────────────────────

export type DbAnnouncement = Tables<'announcements'>
export type DbCategory = Tables<'categories'>
export type DbOrganization = Tables<'organizations'>
export type DbUser = Tables<'users'>
export type DbInvitation = Tables<'invitations'>
export type DbAuditLog = Tables<'audit_log'>

export type DbAnnouncementReview = Tables<'announcement_reviews'>
export type DbOrgCategoryPermission = Tables<'org_category_permissions'>

// ─── Enum types ──────────────────────────────────────────────

export type PostStatus = Enums<'post_status'>
export type AnnouncementUrgency = Enums<'announcement_urgency'>
export type AnnouncementDisplayFont = Enums<'announcement_display_font'>
export type AnnouncementDisplaySize = Enums<'announcement_display_size'>
export type UserRole = Enums<'user_role'>
export type AppRole = UserRole | 'owner'
export type OrgStatus = Enums<'org_status'>
export type OrgType = Enums<'org_type'>
export type OrgMemberRole = Enums<'org_member_role'>

// ─── Relation types ──────────────────────────────────────────

export type AnnouncementWithRelations = DbAnnouncement & {
  categories: Pick<DbCategory, 'id' | 'name' | 'slug' | 'color'> | null
  organizations: Pick<DbOrganization, 'id' | 'name' | 'slug' | 'logo_url'> | null
}

export type OrganizationWithOwner = DbOrganization & {
  users: Pick<DbUser, 'id' | 'display_name' | 'email'> | null
}

export type AnnouncementForReview = DbAnnouncement & {
  categories: Pick<DbCategory, 'name' | 'slug' | 'color'> | null
  organizations: Pick<DbOrganization, 'name' | 'slug'> | null
  users: Pick<DbUser, 'display_name' | 'email'> | null
}

export type OrgWithMembers = DbOrganization & {
  organization_members: {
    user_id: string
    member_role: OrgMemberRole
    users: Pick<DbUser, 'display_name' | 'email'>
  }[]
}

export type PublisherWithOrgs = DbUser & {
  organization_members: {
    organization_id: string
    member_role: OrgMemberRole
    organizations: Pick<DbOrganization, 'name' | 'slug'>
  }[]
}
