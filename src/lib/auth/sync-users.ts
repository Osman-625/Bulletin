import type { User } from '@supabase/supabase-js'
import { reportServerError } from '@/lib/error-reporting'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types'

const DEFAULT_PROFILE_ROLE = 'publisher' satisfies UserRole

type UserProfileInsert = {
  id: string
  email: string
  display_name: string
  role: UserRole
  force_password_change: boolean
}

function metadataValue(user: User, key: string): string | null {
  const value = user.user_metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function authUserToProfileInsert(user: User): UserProfileInsert {
  const email = user.email?.trim() || `user-${user.id}@auth.local`
  const displayName =
    metadataValue(user, 'display_name') ??
    metadataValue(user, 'full_name') ??
    metadataValue(user, 'name') ??
    metadataValue(user, 'username') ??
    email.split('@')[0] ??
    `user-${user.id.slice(0, 8)}`

  return {
    id: user.id,
    email,
    display_name: displayName,
    role: DEFAULT_PROFILE_ROLE,
    force_password_change: false,
  }
}

export async function ensureAuthUserProfile(user: User): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .upsert(authUserToProfileInsert(user), { onConflict: 'id', ignoreDuplicates: true })

  if (error) {
    reportServerError('auth.ensure_user_profile.upsert_failed', error, {
      userId: user.id,
      email: user.email ?? null,
    })
    return false
  }

  return true
}

export async function syncAuthUsersToProfiles(): Promise<{ scanned: number; inserted: number }> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (error) {
    reportServerError('auth.sync_users.list_failed', error)
    return { scanned: 0, inserted: 0 }
  }

  const rows = data.users.map(authUserToProfileInsert)
  if (rows.length === 0) return { scanned: 0, inserted: 0 }

  const { data: existingProfiles, error: existingError } = await admin
    .from('users')
    .select('id')
    .in(
      'id',
      rows.map((row) => row.id)
    )

  if (existingError) {
    reportServerError('auth.sync_users.existing_profiles_query_failed', existingError, {
      scanned: rows.length,
    })
    return { scanned: rows.length, inserted: 0 }
  }

  const existingIds = new Set((existingProfiles ?? []).map((profile) => profile.id))
  const missingRows = rows.filter((row) => !existingIds.has(row.id))
  if (missingRows.length === 0) return { scanned: rows.length, inserted: 0 }

  const { error: insertError } = await admin.from('users').insert(missingRows)
  if (insertError) {
    reportServerError('auth.sync_users.insert_missing_profiles_failed', insertError, {
      scanned: rows.length,
      missing: missingRows.length,
    })
    return { scanned: rows.length, inserted: 0 }
  }

  return { scanned: rows.length, inserted: missingRows.length }
}
