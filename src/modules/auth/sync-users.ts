import type { User } from '@supabase/supabase-js'
import { reportServerError } from '@/shared/errors/error-reporting'
import { createAdminClient } from '@/infrastructure/database/admin'
import type { UserRole } from '@/shared/types'

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
