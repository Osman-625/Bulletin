#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Creates / resets test accounts for E2E tests and writes credentials to
 * .env.test.local. Run once (or any time you need fresh passwords):
 *
 *   node scripts/seed-test-users.js
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function loadEnv(file) {
  try {
    const content = fs.readFileSync(file, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
      }
    }
  } catch { /* file may not exist */ }
}

loadEnv(path.join(__dirname, '../.env.local'))
loadEnv(path.join(__dirname, '../.env.test.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const SETUP_SECRET =
  process.env.SETUP_SECRET && process.env.SETUP_SECRET !== 'replace-with-test-setup-secret'
    ? process.env.SETUP_SECRET
    : 'test-setup-secret'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function randomPassword() {
  return 'Test!' + crypto.randomBytes(8).toString('hex')
}

function assertNoError(error, message) {
  if (error) throw new Error(`${message}: ${error.message}`)
}

async function findAuthUserByEmail(email) {
  const normalizedEmail = email.toLowerCase()
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    assertNoError(error, 'Could not list auth users')

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)
    if (match) return match
    if (data.users.length < 1000) return null
    page += 1
  }
}

// Each entry maps to exactly one pair of env vars written to .env.test.local.
const TEST_ACCOUNTS = [
  {
    email:               'osman_owner@bulletin.internal',
    display_name:        'osman_owner',
    role:                'owner',
    force_password_change: false,
    envEmail:            'TEST_OWNER_EMAIL',
    envPassword:         'TEST_OWNER_PASSWORD',
  },
  {
    email:               'test_superadmin@bulletin.internal',
    display_name:        'test_superadmin',
    role:                'super_admin',
    force_password_change: false,
    envEmail:            'TEST_SUPER_ADMIN_EMAIL',
    envPassword:         'TEST_SUPER_ADMIN_PASSWORD',
  },
  {
    email:               'test_admin@bulletin.internal',
    display_name:        'test_admin',
    role:                'admin',
    force_password_change: false,
    envEmail:            'TEST_ADMIN_EMAIL',
    envPassword:         'TEST_ADMIN_PASSWORD',
  },
  {
    email:               'test_publisher@bulletin.internal',
    display_name:        'test_publisher',
    role:                'publisher',
    force_password_change: false,
    envEmail:            'TEST_PUBLISHER_EMAIL',
    envPassword:         'TEST_PUBLISHER_PASSWORD',
  },
  {
    email:               'test_forcechange@bulletin.internal',
    display_name:        'test_forcechange',
    role:                'admin',
    force_password_change: true,
    envEmail:            'TEST_FORCE_CHANGE_EMAIL',
    envPassword:         'TEST_FORCE_CHANGE_PASSWORD',
  },
]

const SAMPLE_ANNOUNCEMENTS = [
  {
    id: '10000000-0000-4000-8000-000000000101',
    title: 'Campus Night Market & Food Festival',
    categorySlug: 'events',
    banner_url: '/sample-announcements/campus-festival.png',
    registration_link: 'https://forms.gle/example-campus-night-market',
    urgency: 'urgent',
    display_font: 'editorial',
    display_size: 'large',
    publishedOffsetDays: 1,
    expiresInDays: 21,
    body: `## Campus Night Market & Food Festival

Student Affairs is turning the central plaza into a night market with food booths, mini games, and live acoustic sets.

### Event Details

- **Date:** 22 May 2026
- **Time:** 6:00 pm - 10:30 pm
- **Venue:** Central Plaza
- **Entry:** Free for all students and staff

Clubs can register one booth each. Booth slots are limited and confirmed on a first-ready, first-approved basis.`,
  },
  {
    id: '10000000-0000-4000-8000-000000000102',
    title: 'Graduate Career Booth Week',
    categorySlug: 'opportunities',
    banner_url: '/sample-announcements/career-booth.jpg',
    registration_link: 'https://forms.gle/example-career-week',
    urgency: 'important',
    display_font: 'clean',
    display_size: 'standard',
    publishedOffsetDays: 2,
    expiresInDays: 18,
    body: `## Meet Employers Before Internship Season

Career Services is hosting booth sessions with employers from banking, logistics, hospitality, technology, and creative industries.

### What to Bring

- Updated resume
- Student ID
- Portfolio link if relevant
- Questions about internship and graduate roles

Students may book resume clinics in 15-minute slots before meeting recruiters.`,
  },
  {
    id: '10000000-0000-4000-8000-000000000103',
    title: 'Student Creative Showcase Submissions',
    categorySlug: 'student-life',
    banner_url: '/sample-announcements/student-showcase.png',
    registration_link: 'https://forms.gle/example-creative-showcase',
    urgency: 'normal',
    display_font: 'editorial',
    display_size: 'large',
    publishedOffsetDays: 3,
    expiresInDays: 25,
    body: `## Share Your Best Work

The Student Creative Showcase is accepting posters, short films, photography, prototypes, and performance proposals.

### Submission Categories

- Visual design and illustration
- Photography and short video
- Product or software prototype
- Live performance

Selected work will be exhibited in the library gallery and featured on the public bulletin feed.`,
  },
  {
    id: '10000000-0000-4000-8000-000000000104',
    title: 'AI Study Skills Workshop',
    categorySlug: 'academic',
    banner_url: '/sample-announcements/workshop-poster.jpeg',
    registration_link: 'https://forms.gle/example-ai-study-skills',
    urgency: 'important',
    display_font: 'clean',
    display_size: 'compact',
    publishedOffsetDays: 4,
    expiresInDays: 14,
    body: `## Use AI Responsibly for Learning

This workshop helps students use AI tools for planning, revision, feedback, and citation checking while staying within academic integrity rules.

### Topics Covered

- Prompting for study plans
- Checking understanding without copying
- Turning notes into revision questions
- What must be cited or avoided

Bring a laptop and one current assignment brief.`,
  },
]

async function ensureTestOrg(ownerUserId) {
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'test-org')
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ status: 'approved', owner_id: ownerUserId })
      .eq('id', existing.id)
    assertNoError(updateError, 'Could not update test org')
    return existing.id
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({ name: 'Test Organization', slug: 'test-org', status: 'approved', owner_id: ownerUserId })
    .select('id')
    .single()

  assertNoError(error, 'Could not create test org')
  return data.id
}

async function ensureSampleAnnouncements(orgId, authorId) {
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', [...new Set(SAMPLE_ANNOUNCEMENTS.map((sample) => sample.categorySlug))])
  assertNoError(categoriesError, 'Could not load categories for sample announcements')

  const categoryBySlug = new Map((categories ?? []).map((category) => [category.slug, category.id]))
  const now = Date.now()

  for (const sample of SAMPLE_ANNOUNCEMENTS) {
    const categoryId = categoryBySlug.get(sample.categorySlug)
    if (!categoryId) continue

    const publishedAt = new Date(now - sample.publishedOffsetDays * 24 * 60 * 60 * 1000).toISOString()
    const expiresAt = new Date(now + sample.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from('announcements')
      .upsert(
        {
          id: sample.id,
          title: sample.title,
          body: sample.body,
          status: 'published',
          category_id: categoryId,
          organization_id: orgId,
          author_id: authorId,
          urgency: sample.urgency,
          display_font: sample.display_font,
          display_size: sample.display_size,
          banner_url: sample.banner_url,
          registration_link: sample.registration_link,
          published_at: publishedAt,
          expires_at: expiresAt,
          updated_at: publishedAt,
        },
        { onConflict: 'id' }
      )
    assertNoError(error, `Could not upsert sample announcement ${sample.title}`)
  }
}

async function upsertAccount(account, orgId) {
  const password = randomPassword()
  const { email, display_name, role, force_password_change } = account

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  assertNoError(existingError, `Could not look up ${email}`)

  let userId

  const authUser = await findAuthUserByEmail(email)

  if (authUser || existing) {
    userId = authUser?.id ?? existing.id
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { display_name, role },
    })
    assertNoError(authError, `Could not update auth user ${email}`)

    const { error: profileError } = await supabase
      .from('users')
      .upsert(
        { id: userId, email, display_name, role, force_password_change },
        { onConflict: 'id' }
      )
    assertNoError(profileError, `Could not upsert profile ${email}`)
    console.log(`  updated  ${email}`)
  } else {
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name, role },
    })
    assertNoError(error, `Could not create ${email}`)
    if (!authData.user) throw new Error(`Could not create ${email}: missing auth user`)

    const { error: profileError } = await supabase
      .from('users')
      .upsert(
        { id: authData.user.id, email, display_name, role, force_password_change },
        { onConflict: 'id' }
      )
    assertNoError(profileError, `Could not upsert profile ${email}`)
    userId = authData.user.id
    console.log(`  created  ${email}`)
  }

  if (['admin', 'publisher'].includes(role)) {
    const { error: membershipError } = await supabase
      .from('organization_members')
      .upsert(
        {
          user_id: userId,
          organization_id: orgId,
          member_role: role === 'admin' ? 'admin' : 'publisher',
        },
        { onConflict: 'organization_id,user_id' }
      )
    assertNoError(membershipError, `Could not upsert org membership for ${email}`)
  }

  return password
}

async function main() {
  console.log('Seeding test accounts...\n')

  const ownerAccount = TEST_ACCOUNTS.find((a) => a.role === 'owner')
  if (!ownerAccount) throw new Error('No owner account defined in TEST_ACCOUNTS')

  const lines = []
  lines.push('PLAYWRIGHT_BASE_URL=http://localhost:3000')
  lines.push('E2E_DISABLE_RATE_LIMIT=1')
  lines.push(`SETUP_SECRET=${SETUP_SECRET}`)
  lines.push('')

  // Owner must exist before we can create the org (owner_id NOT NULL)
  const ownerPassword = await upsertAccount(ownerAccount, null)
  lines.push(`${ownerAccount.envEmail}=${ownerAccount.email}`)
  lines.push(`${ownerAccount.envPassword}=${ownerPassword}`)

  const { data: ownerRow, error: ownerError } = await supabase
    .from('users')
    .select('id')
    .eq('email', ownerAccount.email)
    .single()
  assertNoError(ownerError, 'Owner row not found after upsert')
  if (!ownerRow) throw new Error('Owner row not found after upsert')

  const orgId = await ensureTestOrg(ownerRow.id)
  console.log(`Test org: ${orgId}\n`)
  await ensureSampleAnnouncements(orgId, ownerRow.id)

  for (const account of TEST_ACCOUNTS) {
    if (account.role === 'owner') continue
    const password = await upsertAccount(account, orgId)
    lines.push(`${account.envEmail}=${account.email}`)
    lines.push(`${account.envPassword}=${password}`)
  }

  const envPath = path.join(__dirname, '../.env.test.local')
  fs.writeFileSync(envPath, lines.join('\n') + '\n')

  console.log('\nCredentials written to .env.test.local')
  console.log('Run: npm run test:e2e')
}

main().catch((err) => { console.error(err.message); process.exit(1) })
