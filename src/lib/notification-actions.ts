'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'
import { getCurrentAccessContext } from './auth/authz'

const NOTIFICATION_PATHS = [
  '/dashboard/notifications',
  '/admin/notifications',
  '/super-admin/notifications',
  '/owner/notifications',
  '/dashboard',
  '/admin',
  '/super-admin',
  '/owner',
]

function revalidateNotificationPaths() {
  for (const path of NOTIFICATION_PATHS) {
    revalidatePath(path)
  }
}

export async function markNotificationRead(notificationId: string) {
  const access = await getCurrentAccessContext()
  if (!access) return

  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', access.userId)
    .is('read_at', null)

  revalidateNotificationPaths()
}

export async function markAllNotificationsRead() {
  const access = await getCurrentAccessContext()
  if (!access) return

  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', access.userId)
    .is('read_at', null)

  revalidateNotificationPaths()
}
