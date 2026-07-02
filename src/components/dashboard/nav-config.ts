import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  ScrollText,
  Settings,
  ShieldCheck,
  SquarePen,
  Tag,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  canAccessAdminArea,
  canAccessOwnerArea,
  canAccessPublisherArea,
  canAccessSuperAdminArea,
  type AppRole,
} from '@/modules/auth/roles'

export type DashboardVariant = 'publisher' | 'admin' | 'super_admin' | 'owner'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  activePrefixes?: string[]
  excludePrefixes?: string[]
  badge?: number
}

const publisherNav: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Newspaper, exact: true },
  {
    href: '/dashboard/announcements',
    label: 'Announcements',
    icon: Megaphone,
    exact: true,
    activePrefixes: ['/dashboard/announcements/'],
    excludePrefixes: ['/dashboard/announcements/new'],
  },
  { href: '/dashboard/announcements/new', label: 'New announcement', icon: SquarePen },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/dashboard/insights', label: 'Insights', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
]

function adminNav(pendingCount: number): NavItem[] {
  return [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    {
      href: '/admin/review',
      label: 'Review queue',
      icon: ClipboardList,
      badge: pendingCount || undefined,
    },
    { href: '/admin/orgs', label: 'Organizations', icon: Building2 },
    { href: '/admin/publishers', label: 'Publishers', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: Tag },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
  ]
}

const superAdminNav: NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/super-admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/super-admin/categories', label: 'Categories', icon: Tag },
  { href: '/super-admin/users', label: 'Users', icon: UserCog },
  { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/super-admin/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
]

const ownerNav: NavItem[] = [
  { href: '/owner', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/owner/resources', label: 'Resources', icon: Activity },
  { href: '/owner/users', label: 'All users', icon: Users },
  { href: '/owner/categories', label: 'Categories', icon: Tag },
  { href: '/owner/audit', label: 'Audit log', icon: ScrollText },
  { href: '/owner/settings', label: 'Settings', icon: Settings },
  { href: '/', label: 'Public board', icon: ArrowUpRight, exact: true },
]

export const ROLE_TABS: Array<{ variant: DashboardVariant; href: string; label: string }> = [
  { variant: 'owner', href: '/owner', label: 'Owner' },
  { variant: 'super_admin', href: '/super-admin', label: 'Super' },
  { variant: 'admin', href: '/admin', label: 'Admin' },
  { variant: 'publisher', href: '/dashboard', label: 'Publisher' },
]

const WORKSPACE_LABELS: Record<DashboardVariant, string> = {
  publisher: 'Publisher board',
  admin: 'Admin board',
  super_admin: 'Super board',
  owner: 'Owner board',
}

const SETTINGS_HREFS: Record<DashboardVariant, string> = {
  publisher: '/dashboard/settings',
  admin: '/admin/settings',
  super_admin: '/super-admin/settings',
  owner: '/owner/settings',
}

const NOTIFICATION_HREFS: Record<DashboardVariant, string> = {
  publisher: '/dashboard/notifications',
  admin: '/admin/notifications',
  super_admin: '/super-admin/notifications',
  owner: '/owner/notifications',
}

export function getNavForVariant(variant: DashboardVariant, pendingReviewCount = 0): NavItem[] {
  switch (variant) {
    case 'owner':
      return ownerNav
    case 'admin':
      return adminNav(pendingReviewCount)
    case 'super_admin':
      return superAdminNav
    default:
      return publisherNav
  }
}

export function getWorkspaceLabel(variant: DashboardVariant): string {
  return WORKSPACE_LABELS[variant]
}

export function getSettingsHref(variant: DashboardVariant): string {
  return SETTINGS_HREFS[variant]
}

export function getNotificationsHref(variant: DashboardVariant): string {
  return NOTIFICATION_HREFS[variant]
}

const TAB_ACCESS: Record<DashboardVariant, (role: AppRole) => boolean> = {
  publisher: canAccessPublisherArea,
  admin: canAccessAdminArea,
  super_admin: canAccessSuperAdminArea,
  owner: canAccessOwnerArea,
}

export function canUseRoleTab(role: string | null | undefined, tabVariant: DashboardVariant) {
  if (!role) return false
  return TAB_ACCESS[tabVariant](role as AppRole)
}

export function getIsActive(item: NavItem, pathname: string): boolean {
  const excluded = item.excludePrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false
  if (excluded) return false
  if (item.exact) {
    return (
      pathname === item.href ||
      (item.activePrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false)
    )
  }
  return pathname.startsWith(item.href)
}
