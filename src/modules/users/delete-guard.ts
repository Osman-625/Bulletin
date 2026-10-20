import type { SupabaseClient } from '@supabase/supabase-js'
import { reportServerError } from '@/shared/errors/error-reporting'
import type { Database } from '@/infrastructure/database/database.types'

const BLOCKED_MESSAGE =
  "This user has announcements, reviews, invitations or organizations on record, so the account can't be deleted."

/**
 * Returns why an account can't be deleted, or null when it can. Those tables reference the user
 * without cascade, so Supabase refuses the delete and the admin only sees a generic failure.
 */
export async function getUserDeleteBlocker(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const head = { count: 'exact', head: true } as const
  const results = await Promise.all([
    supabase.from('announcements').select('id', head).eq('author_id', userId),
    supabase.from('announcement_reviews').select('id', head).eq('reviewer_id', userId),
    supabase.from('invitations').select('id', head).eq('invited_by', userId),
    supabase.from('organizations').select('id', head).eq('owner_id', userId),
    supabase.from('organizations').select('id', head).eq('approved_by', userId),
  ])

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    reportServerError('users.delete_guard.lookup_failed', failed.error, { targetId: userId })
    return 'Could not check whether this user can be deleted. Try again.'
  }

  return results.some((result) => (result.count ?? 0) > 0) ? BLOCKED_MESSAGE : null
}

/** An org admin may only delete a publisher who belongs to no organization outside their own. */
export async function getSharedOrganizationBlocker(
  supabase: SupabaseClient<Database>,
  userId: string,
  actorOrgIds: string[]
): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)

  if (error) {
    reportServerError('users.delete_guard.memberships_failed', error, { targetId: userId })
    return "Could not check this user's organizations. Try again."
  }

  return data.every((membership) => actorOrgIds.includes(membership.organization_id))
    ? null
    : 'This user also belongs to organizations outside yours, so only a super admin can delete the account.'
}
