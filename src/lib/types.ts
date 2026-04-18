import type { Tables, Enums } from './database.types'

// ─── Row types ───────────────────────────────────────────────

export type DbAnnouncement = Tables<'announcements'>
export type DbCategory = Tables<'categories'>
export type DbOrganization = Tables<'organizations'>
export type DbUser = Tables<'users'>
export type DbInvitation = Tables<'invitations'>
export type DbAuditLog = Tables<'audit_log'>

// ─── Enum types ──────────────────────────────────────────────

export type PostStatus = Enums<'post_status'>
export type UserRole = Enums<'user_role'>
export type OrgStatus = Enums<'org_status'>
export type OrgType = Enums<'org_type'>

// ─── Relation types ──────────────────────────────────────────

export type AnnouncementWithRelations = DbAnnouncement & {
  categories: Pick<DbCategory, 'id' | 'name' | 'slug' | 'color'> | null
  organizations: Pick<DbOrganization, 'id' | 'name' | 'slug' | 'logo_url'> | null
}

export type OrganizationWithOwner = DbOrganization & {
  users: Pick<DbUser, 'id' | 'display_name' | 'email'> | null
}
