import { redirect } from 'next/navigation'
import { AccountSettingsPage } from '@/components/account/AccountSettingsPage'
import { getCurrentAccessContext } from '@/lib/auth/authz'

export const metadata = { title: 'Settings - Bulletin Dashboard' }

export default async function PublisherSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; password?: string; error?: string }>
}) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  return <AccountSettingsPage access={access} variant="publisher" search={await searchParams} />
}
