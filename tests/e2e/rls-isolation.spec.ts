import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from './helpers/env'

type RlsFixture = {
  runId: string
  users: string[]
  orgs: string[]
  announcements: string[]
  storagePaths: string[]
}

type PublisherFixture = {
  email: string
  id: string
  orgId: string
  supabase: SupabaseClient
}

const PASSWORD = 'Rls-isolation-test-password-42'

function serviceClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

function authenticatedClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

async function createPublisherFixture(
  fixture: RlsFixture,
  label: 'a' | 'b'
): Promise<PublisherFixture> {
  const service = serviceClient()
  const email = `rls-${fixture.runId}-${label}@bulletin.test`
  const displayName = `RLS ${fixture.runId} ${label.toUpperCase()}`

  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (authError || !authData.user) {
    throw new Error(`Could not create ${label} RLS auth user: ${authError?.message ?? email}`)
  }

  const userId = authData.user.id
  fixture.users.push(userId)

  const { error: profileError } = await service.from('users').upsert({
    id: userId,
    email,
    display_name: displayName,
    role: 'publisher',
    force_password_change: false,
  })

  if (profileError) {
    throw new Error(`Could not create ${label} RLS profile: ${profileError.message}`)
  }

  const { data: org, error: orgError } = await service
    .from('organizations')
    .insert({
      name: `RLS ${fixture.runId} ${label.toUpperCase()}`,
      slug: `rls-${fixture.runId}-${label}`,
      description: 'Temporary organization for RLS isolation tests.',
      status: 'approved',
      owner_id: userId,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (orgError || !org) {
    throw new Error(`Could not create ${label} RLS organization: ${orgError?.message}`)
  }

  fixture.orgs.push(org.id)

  const { error: membershipError } = await service.from('organization_members').upsert(
    {
      organization_id: org.id,
      user_id: userId,
      member_role: 'publisher',
    },
    { onConflict: 'organization_id,user_id' }
  )

  if (membershipError) {
    throw new Error(`Could not create ${label} RLS membership: ${membershipError.message}`)
  }

  const supabase = authenticatedClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  })

  if (signInError) {
    throw new Error(`Could not sign in ${label} RLS user: ${signInError.message}`)
  }

  return {
    email,
    id: userId,
    orgId: org.id,
    supabase,
  }
}

async function createDraftAnnouncement(fixture: RlsFixture, publisher: PublisherFixture) {
  const service = serviceClient()
  const title = `RLS Draft ${fixture.runId}`

  const { data, error } = await service
    .from('announcements')
    .insert({
      title,
      body: 'Draft announcement used to verify cross-organization RLS isolation.',
      status: 'draft',
      organization_id: publisher.orgId,
      author_id: publisher.id,
    })
    .select('id, title')
    .single()

  if (error || !data) {
    throw new Error(`Could not create RLS draft announcement: ${error?.message}`)
  }

  fixture.announcements.push(data.id)
  return data
}

async function getServiceAnnouncement(id: string) {
  const { data, error } = await serviceClient()
    .from('announcements')
    .select('id, title')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error(`Could not read RLS announcement with service role: ${error?.message}`)
  }

  return data
}

async function cleanupRlsFixture(fixture: RlsFixture) {
  const service = serviceClient()

  if (fixture.storagePaths.length > 0) {
    await service.storage.from('banner-images').remove(fixture.storagePaths)
  }

  if (fixture.announcements.length > 0) {
    await service.from('announcements').delete().in('id', fixture.announcements)
  }

  if (fixture.orgs.length > 0) {
    await service.from('organizations').delete().in('id', fixture.orgs)
  }

  for (const userId of fixture.users) {
    await service.auth.admin.deleteUser(userId)
  }
}

test.describe('Supabase RLS isolation', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      'Database policy test only needs one project'
    )
  })

  test('publisher cannot read or mutate another organization announcement or storage namespace', async () => {
    const fixture: RlsFixture = {
      runId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      users: [],
      orgs: [],
      announcements: [],
      storagePaths: [],
    }

    try {
      const publisherA = await createPublisherFixture(fixture, 'a')
      const publisherB = await createPublisherFixture(fixture, 'b')
      const draft = await createDraftAnnouncement(fixture, publisherA)

      await test.step('publisher can read their own organization draft announcement', async () => {
        const { data, error } = await publisherA.supabase
          .from('announcements')
          .select('id, title')
          .eq('id', draft.id)
          .single()

        expect(error).toBeNull()
        expect(data?.id).toBe(draft.id)
      })

      await test.step('publisher cannot read another organization draft announcement', async () => {
        const { data, error } = await publisherB.supabase
          .from('announcements')
          .select('id, title')
          .eq('id', draft.id)

        expect(error).toBeNull()
        expect(data).toEqual([])
      })

      await test.step('publisher cannot update another organization announcement', async () => {
        const attemptedTitle = `${draft.title} - forbidden update`
        const { data, error } = await publisherB.supabase
          .from('announcements')
          .update({ title: attemptedTitle })
          .eq('id', draft.id)
          .select('id')

        expect(error).toBeNull()
        expect(data).toEqual([])
        await expect
          .poll(async () => (await getServiceAnnouncement(draft.id)).title)
          .toBe(draft.title)
      })

      await test.step('publisher cannot upload into another organization banner namespace', async () => {
        const file = new Blob(['rls isolation'], { type: 'image/png' })
        const ownStoragePath = `${publisherA.id}/${publisherA.orgId}/${fixture.runId}.png`
        const crossOrgStoragePath = `${publisherB.id}/${publisherA.orgId}/${fixture.runId}.png`

        const ownUpload = await publisherA.supabase.storage
          .from('banner-images')
          .upload(ownStoragePath, file, { contentType: 'image/png' })
        expect(ownUpload.error).toBeNull()
        fixture.storagePaths.push(ownStoragePath)

        const crossOrgUpload = await publisherB.supabase.storage
          .from('banner-images')
          .upload(crossOrgStoragePath, file, { contentType: 'image/png' })
        expect(crossOrgUpload.error).toBeTruthy()
      })
    } finally {
      await cleanupRlsFixture(fixture)
    }
  })
})
