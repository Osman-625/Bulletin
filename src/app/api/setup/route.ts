import { reportServerError } from '@/shared/errors/error-reporting'
import { createServiceClient } from '@/infrastructure/database/server'
import { checkPersistentRateLimit } from '@/shared/middleware/persistent-rate-limit'
import { rateLimitKey } from '@/shared/middleware/rate-limit'
import { NextResponse } from 'next/server'

const SETUP_WRITE_ERROR = 'Setup failed. Check server logs and try again.'
const SETUP_CONFIG_ERROR = 'Setup route configuration is incomplete.'

function readSetupOwnerConfig() {
  const email = process.env.SETUP_OWNER_EMAIL?.trim()
  const username = process.env.SETUP_OWNER_USERNAME?.trim()
  const tempPassword = process.env.SETUP_OWNER_TEMP_PASSWORD?.trim()

  if (!email || !username || !tempPassword || tempPassword.length < 12) return null

  return {
    email,
    username,
    tempPassword,
  }
}

function setupFailed(context: string, error: unknown) {
  reportServerError(context, error)
  return NextResponse.json({ error: SETUP_WRITE_ERROR }, { status: 500 })
}

// One-time owner bootstrap — requires SETUP_SECRET header.
// Keep disabled except during the explicit bootstrap window.
export async function POST(request: Request) {
  if (process.env.ENABLE_SETUP_ROUTE !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    const rateLimit = await checkPersistentRateLimit(rateLimitKey('setup', request.headers), {
      limit: 5,
      windowMs: 60_000,
    })
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many setup attempts' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }
  }

  const secret = process.env.SETUP_SECRET?.trim()
  if (!secret || request.headers.get('x-setup-secret') !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const owner = readSetupOwnerConfig()
  if (!owner) {
    return NextResponse.json({ error: SETUP_CONFIG_ERROR }, { status: 412 })
  }

  const supabase = await createServiceClient()

  const { data: existingOwner, error: ownerReadError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'owner')
    .maybeSingle()

  if (ownerReadError) return setupFailed('setup.owner_read_failed', ownerReadError)

  if (existingOwner) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 409 })
  }

  const { data: existingUser, error: existingUserReadError } = await supabase
    .from('users')
    .select('id')
    .eq('email', owner.email)
    .maybeSingle()

  if (existingUserReadError) {
    return setupFailed('setup.existing_user_read_failed', existingUserReadError)
  }

  if (existingUser) {
    const { error: existingAuthUpdateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: owner.tempPassword }
    )
    if (existingAuthUpdateError) {
      return setupFailed('setup.existing_user_auth_update_failed', existingAuthUpdateError)
    }

    const { error: existingProfileUpdateError } = await supabase
      .from('users')
      .update({ role: 'owner', display_name: owner.username, force_password_change: true })
      .eq('id', existingUser.id)

    if (existingProfileUpdateError) {
      return setupFailed('setup.existing_user_profile_update_failed', existingProfileUpdateError)
    }

    return NextResponse.json({
      ok: true,
      username: owner.username,
      note: 'Log in with the configured setup password and change it immediately.',
    })
  }

  const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
    email: owner.email,
    password: owner.tempPassword,
    email_confirm: true,
    user_metadata: { display_name: owner.username },
  })

  if (authCreateError) {
    return setupFailed('setup.auth_create_failed', authCreateError)
  }

  if (!authData.user) {
    return setupFailed(
      'setup.auth_create_missing_user',
      new Error('Owner auth user was not returned after creation')
    )
  }

  const { error: createdProfileUpdateError } = await supabase
    .from('users')
    .update({ role: 'owner', display_name: owner.username, force_password_change: true })
    .eq('id', authData.user.id)

  if (createdProfileUpdateError) {
    return setupFailed('setup.created_user_profile_update_failed', createdProfileUpdateError)
  }

  return NextResponse.json({
    ok: true,
    username: owner.username,
    note: 'Log in with the configured setup password and change it immediately.',
  })
}
