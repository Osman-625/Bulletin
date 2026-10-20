import type { SupabaseClient } from '@supabase/supabase-js'
import { reportServerError } from '@/shared/errors/error-reporting'
import type { Database } from '@/infrastructure/database/database.types'

const DISPLAY_NAME_MIN_LENGTH = 2
const DISPLAY_NAME_MAX_LENGTH = 60

type DisplayNameResult = { ok: true; name: string } | { ok: false; message: string }

/**
 * Checks length and that no other account uses the name (case-insensitive). Username login looks
 * a name up with `.maybeSingle()`, so a shared name would break sign-in for both accounts.
 * shortcut: app-level check only, two simultaneous sign-ups can still collide; a unique index
 * needs the `handle_new_user` trigger to cope with e-mail prefixes that repeat.
 */
export async function validateDisplayName(
  supabase: SupabaseClient<Database>,
  value: string,
  exceptUserId?: string
): Promise<DisplayNameResult> {
  const name = value.trim()
  if (name.length < DISPLAY_NAME_MIN_LENGTH || name.length > DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Display name must be ${DISPLAY_NAME_MIN_LENGTH}-${DISPLAY_NAME_MAX_LENGTH} characters.`,
    }
  }

  // ilike treats % and _ as wildcards, so escape them to compare the name literally.
  let query = supabase
    .from('users')
    .select('id')
    .ilike('display_name', name.replace(/[\\%_]/g, '\\$&'))
    .limit(1)
  if (exceptUserId) query = query.neq('id', exceptUserId)

  const { data, error } = await query
  if (error) {
    reportServerError('users.display_name.lookup_failed', error)
    return { ok: false, message: 'Could not check that display name. Try again.' }
  }
  if (data.length > 0) return { ok: false, message: 'That display name is already taken.' }

  return { ok: true, name }
}
