import { redirect } from 'next/navigation'
import { AccountSettingsPage } from '@/components/account/AccountSettingsPage'
import {
  canAccessSuperAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/lib/auth/authz'

export const metadata = { title: 'Settings - Bulletin Super Admin' }

export default async function SuperAdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; password?: string; error?: string }>
}) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  return <AccountSettingsPage access={access} variant="super_admin" search={await searchParams} />
}
