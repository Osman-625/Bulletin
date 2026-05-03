import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// One-time owner bootstrap — disabled permanently after first successful call.
export async function POST() {
  const supabase = await createServiceClient()

  const { data: existingOwner } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'owner')
    .maybeSingle()

  if (existingOwner) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 409 })
  }

  // Check if the auth user was already created manually via Dashboard
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'osman_owner@bulletin.internal')
    .maybeSingle()

  if (existingUser) {
    // User exists — just promote to owner
    await supabase
      .from('users')
      .update({ role: 'owner', display_name: 'osman_owner' })
      .eq('id', existingUser.id)

    return NextResponse.json({
      ok: true,
      username: 'osman_owner',
      note: 'Existing user promoted to owner.',
    })
  }

  // No user yet — create from scratch
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'osman_owner@bulletin.internal',
    password: 'Maaney121@',
    email_confirm: true,
    user_metadata: { display_name: 'osman_owner' },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  await supabase
    .from('users')
    .update({ role: 'owner', display_name: 'osman_owner' })
    .eq('id', authData.user.id)

  return NextResponse.json({
    ok: true,
    username: 'osman_owner',
    password: 'Maaney121@',
    note: 'Change your password after first login.',
  })
}
