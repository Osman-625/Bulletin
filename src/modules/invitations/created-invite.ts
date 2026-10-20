import 'server-only'

import { getCurrentAccessContext } from '@/modules/auth/authz'
import { createClient } from '@/infrastructure/database/server'

/** The invite the signed-in user just created, looked up by id so the token never rides in a URL. */
export async function getCreatedInvite(created?: string) {
  if (!created) return null

  const access = await getCurrentAccessContext()
  if (!access) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('email, token')
    .eq('id', created)
    .eq('invited_by', access.userId)
    .maybeSingle()

  if (error) return null
  return data
}
