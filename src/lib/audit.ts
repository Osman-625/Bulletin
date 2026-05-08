import { revalidatePath } from 'next/cache'
import type { Json } from './database.types'
import { createServiceClient } from './supabase/server'

type AuditMetadata = Record<string, Json | undefined>

type AuditEventInput = {
  actorId?: string | null
  action: string
  targetType: string
  targetId?: string | null
  metadata?: AuditMetadata | null
}

const OWNER_AUDIT_PATHS = ['/owner', '/owner/audit']

export async function logAuditEvent({
  actorId = null,
  action,
  targetType,
  targetId = null,
  metadata = null,
}: AuditEventInput) {
  try {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('audit_log').insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata ?? null,
    })

    if (error) {
      console.error('[audit] Failed to write audit event', {
        action,
        targetType,
        targetId,
        message: error.message,
      })
      return
    }

    OWNER_AUDIT_PATHS.forEach((path) => revalidatePath(path))
  } catch (error) {
    console.error('[audit] Failed to write audit event', error)
  }
}
