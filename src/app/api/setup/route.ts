import { reportServerError } from '@/lib/error-reporting'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/security/rate-limit'
import { NextResponse } from 'next/server'

const SETUP_WRITE_ERROR = 'Setup failed. Check server logs and try again.'
const DEFAULT_SETUP_OWNER_EMAIL = 'osman_owner@bulletin.internal'
const DEFAULT_SETUP_OWNER_USERNAME = 'osman_owner'

function readSetupOwnerConfig() {
  const configuredEmail = process.env.SETUP_OWNER_EMAIL?.trim()
  const configuredUsername = process.env.SETUP_OWNER_USERNAME?.trim()
  const email =
    configuredEmail || (process.env.NODE_ENV !== 'production' ? DEFAULT_SETUP_OWNER_EMAIL : '')
  const username =
    configuredUsername ||
    (process.env.NODE_ENV !== 'production' ? DEFAULT_SETUP_OWNER_USERNAME : email.split('@')[0])

  if (!email) return null

  return {
    email,
    username: username || email.split('@')[0],
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

  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    const rateLimit = checkRateLimit(rateLimitKey('setup', request.headers), {
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

  const secret =
    process.env.SETUP_SECRET ??
    (process.env.NODE_ENV !== 'production' ? 'test-setup-secret' : undefined)
  if (!secret || request.headers.get('x-setup-secret') !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const owner = readSetupOwnerConfig()
  if (!owner) {
    return setupFailed(
      'setup.owner_config_missing',
      new Error('SETUP_OWNER_EMAIL is required when setup route is enabled in production')
    )
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

  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const tempPassword = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')

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
      { password: tempPassword }
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
      temp_password: tempPassword,
      note: 'Log in and change your password immediately.',
    })
  }

  const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
    email: owner.email,
    password: tempPassword,
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
    temp_password: tempPassword,
    note: 'Log in and change your password immediately.',
  })
}
