import { redirect } from 'next/navigation'
import { AccountSettingsPage } from '@/components/account/AccountSettingsPage'
import {
  canAccessOwnerArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/modules/auth/authz'

export const metadata = { title: 'Settings - Bulletin Owner' }

export default async function OwnerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; password?: string; error?: string }>
}) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessOwnerArea(access.role)) redirect(getDefaultAppPath(access.role))

  return <AccountSettingsPage access={access} variant="owner" search={await searchParams} />
}
