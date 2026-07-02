'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/infrastructure/database/server'
import { getCurrentAccessContext } from '@/modules/auth/authz'

function revalidateNotificationPaths() {
  revalidatePath('/dashboard/notifications')
  revalidatePath('/admin/notifications')
  revalidatePath('/super-admin/notifications')
  revalidatePath('/owner/notifications')
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/super-admin')
  revalidatePath('/owner')
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
