import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './env'

function adminClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

function authClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}

export async function resetForceChangeAccount() {
  const email = requireEnv('TEST_FORCE_CHANGE_EMAIL')
  const password = requireEnv('TEST_FORCE_CHANGE_PASSWORD')

  await resetUserAccount({
    email,
    password,
    role: 'admin',
    forcePasswordChange: true,
  })
  await waitForPasswordReset({ email, password, label: 'Force-change' })
}

export async function resetPublisherAccount() {
  await resetUserAccount({
    email: requireEnv('TEST_PUBLISHER_EMAIL'),
    password: requireEnv('TEST_PUBLISHER_PASSWORD'),
    role: 'publisher',
    forcePasswordChange: false,
  })
}

export async function getAnnouncementByTitle(title: string) {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, status, published_at, banner_url')
    .eq('title', title)
    .maybeSingle()

  if (error) throw new Error(`Could not read E2E announcement: ${error.message}`)
  return data
}

export async function deleteAnnouncementsByTitle(title: string) {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('id, banner_url')
    .eq('title', title)

  if (error) throw new Error(`Could not find E2E announcements for cleanup: ${error.message}`)

  const storagePaths = (data ?? [])
    .map((announcement) => bannerStoragePath(announcement.banner_url))
    .filter((path): path is string => Boolean(path))

  if (storagePaths.length > 0) {
    await supabase.storage.from('banner-images').remove(storagePaths)
  }

  const { error: deleteError } = await supabase.from('announcements').delete().eq('title', title)
  if (deleteError) throw new Error(`Could not clean up E2E announcement: ${deleteError.message}`)
}

export async function removeBannerStoragePaths(paths: string[]) {
  if (paths.length === 0) return
  const { error } = await adminClient().storage.from('banner-images').remove(paths)
  if (error) throw new Error(`Could not clean up E2E banner storage: ${error.message}`)
}

export async function storageObjectExists(path: string) {
  const parts = path.split('/')
  const name = parts.pop()
  if (!name) return false

  const { data, error } = await adminClient()
    .storage.from('banner-images')
    .list(parts.join('/'), { search: name, limit: 10 })

  if (error) throw new Error(`Could not check E2E banner storage object: ${error.message}`)
  return (data ?? []).some((object) => object.name === name)
}

export function bannerStoragePath(url: string | null): string | null {
  if (!url) return null
  const marker = '/storage/v1/object/public/banner-images/'
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length))
}

async function resetUserAccount({
  email,
  password,
  role,
  forcePasswordChange,
}: {
  email: string
  password: string
  role: 'admin' | 'publisher'
  forcePasswordChange: boolean
}) {
  const supabase = adminClient()

  const { data: profile, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (error || !profile) {
    throw new Error(`Could not find E2E test user: ${error?.message ?? email}`)
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(profile.id, { password })
  if (authError) throw new Error(`Could not reset E2E password: ${authError.message}`)

  const { error: profileError } = await supabase
    .from('users')
    .update({ role, force_password_change: forcePasswordChange })
    .eq('id', profile.id)

  if (profileError) {
    throw new Error(`Could not reset E2E profile: ${profileError.message}`)
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'test-org')
    .single()

  if (orgError || !org) {
    throw new Error(`Could not find E2E test org: ${orgError?.message ?? 'test-org'}`)
  }

  const { error: membershipError } = await supabase.from('organization_members').upsert(
    {
      organization_id: org.id,
      user_id: profile.id,
      member_role: role,
    },
    { onConflict: 'organization_id,user_id' }
  )

  if (membershipError) {
    throw new Error(`Could not reset E2E membership: ${membershipError.message}`)
  }
}

export async function waitForPublisherPasswordReset() {
  await waitForPasswordReset({
    email: requireEnv('TEST_PUBLISHER_EMAIL'),
    password: requireEnv('TEST_PUBLISHER_PASSWORD'),
    label: 'Publisher',
  })
}

async function waitForPasswordReset({
  email,
  password,
  label,
}: {
  email: string
  password: string
  label: string
}) {
  const supabase = authClient()
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    await supabase.auth.signOut()
    if (!error) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`${label} test password did not become usable in time`)
}
