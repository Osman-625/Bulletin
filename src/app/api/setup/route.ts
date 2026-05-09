import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/security/rate-limit'
import { NextResponse } from 'next/server'

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

  const supabase = await createServiceClient()

  const { data: existingOwner } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'owner')
    .maybeSingle()

  if (existingOwner) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 409 })
  }

  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const tempPassword = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'osman_owner@bulletin.internal')
    .maybeSingle()

  if (existingUser) {
    await supabase.auth.admin.updateUserById(existingUser.id, { password: tempPassword })
    await supabase
      .from('users')
      .update({ role: 'owner', display_name: 'osman_owner', force_password_change: true })
      .eq('id', existingUser.id)

    return NextResponse.json({
      ok: true,
      username: 'osman_owner',
      temp_password: tempPassword,
      note: 'Log in and change your password immediately.',
    })
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'osman_owner@bulletin.internal',
    password: tempPassword,
    email_confirm: true,
    user_metadata: { display_name: 'osman_owner' },
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create user' },
      { status: 500 }
    )
  }

  await supabase
    .from('users')
    .update({ role: 'owner', display_name: 'osman_owner', force_password_change: true })
    .eq('id', authData.user.id)

  return NextResponse.json({
    ok: true,
    username: 'osman_owner',
    temp_password: tempPassword,
    note: 'Log in and change your password immediately.',
  })
}
