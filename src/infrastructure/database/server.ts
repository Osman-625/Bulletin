import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from './admin'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — session refresh handled by middleware
          }
        },
      },
    }
  )
}

// Service-role client — bypasses RLS. Only use in trusted server contexts (e.g. admin API routes).
export async function createServiceClient() {
  return createAdminClient()
}
