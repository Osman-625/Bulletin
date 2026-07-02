import { redirect } from 'next/navigation'
import { AccountSettingsPage } from '@/components/account/AccountSettingsPage'
import {
  canAccessAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/modules/auth/authz'

export const metadata = { title: 'Settings - Bulletin Admin' }

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; password?: string; error?: string }>
}) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  return <AccountSettingsPage access={access} variant="admin" search={await searchParams} />
}
