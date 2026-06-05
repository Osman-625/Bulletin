export const INVITATION_EXPIRY_DAYS = 7

const ADMIN_INVITE_ROLES = ['admin', 'super_admin'] as const
const PUBLISHER_MEMBER_ROLES = ['publisher', 'admin'] as const

export type AdminInviteRole = (typeof ADMIN_INVITE_ROLES)[number]
export type PublisherMemberRole = (typeof PUBLISHER_MEMBER_ROLES)[number]

type AdminInvitationFormData = {
  email: string
  role: AdminInviteRole
}

type PublisherInvitationFormData = {
  email: string
  orgIds: string[]
  memberRole: PublisherMemberRole
}

type InvitationFormResult<T> = { ok: true; data: T } | { ok: false; error: string }

function readTrimmedString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readNormalizedEmail(formData: FormData): InvitationFormResult<{ email: string }> {
  const email = readTrimmedString(formData, 'email').toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  return { ok: true, data: { email } }
}

export function readPublisherInvitationFormData(
  formData: FormData
): InvitationFormResult<PublisherInvitationFormData> {
  const emailResult = readNormalizedEmail(formData)
  if (!emailResult.ok) return emailResult

  const orgIds = Array.from(
    new Set(
      formData.getAll('org_ids').flatMap((orgId) => {
        if (typeof orgId !== 'string') return []
        const trimmedOrgId = orgId.trim()
        return trimmedOrgId ? [trimmedOrgId] : []
      })
    )
  )

  if (orgIds.length === 0) {
    return { ok: false, error: 'Select at least one organization for this publisher.' }
  }

  const rawMemberRole = readTrimmedString(formData, 'member_role') || 'publisher'
  if (!PUBLISHER_MEMBER_ROLES.includes(rawMemberRole as PublisherMemberRole)) {
    return { ok: false, error: 'Choose a valid organization role.' }
  }

  return {
    ok: true,
    data: {
      email: emailResult.data.email,
      orgIds,
      memberRole: rawMemberRole as PublisherMemberRole,
    },
  }
}

export function readAdminInvitationFormData(
  formData: FormData
): InvitationFormResult<AdminInvitationFormData> {
  const emailResult = readNormalizedEmail(formData)
  if (!emailResult.ok) return emailResult

  const rawRole = readTrimmedString(formData, 'role') || 'admin'
  if (!ADMIN_INVITE_ROLES.includes(rawRole as AdminInviteRole)) {
    return { ok: false, error: 'Choose a valid admin role.' }
  }

  return {
    ok: true,
    data: {
      email: emailResult.data.email,
      role: rawRole as AdminInviteRole,
    },
  }
}
