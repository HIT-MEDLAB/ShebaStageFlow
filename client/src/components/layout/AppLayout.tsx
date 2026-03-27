import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react'
import { AppSidebar } from '@/components/layout/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/features/auth'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'
import type { NavItem } from '@/components/layout/Sidebar'

export function AppLayout() {
  const { t } = useTranslation()
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await clearAuth()
    navigate('/login')
  }

  const baseNavItems: NavItem[] = [
    { label: t('nav.home'), path: '/home', icon: Home },
    { label: t('nav.scheduler'), path: '/scheduler', icon: Calendar },
    { label: t('nav.constraints'), path: '/constraints', icon: ShieldCheck },
    { label: t('nav.statistics'), path: '/statistics', icon: BarChart3 },
    { label: t('nav.settings'), path: '/settings', icon: Settings },
  ]

  const isAdmin = useIsAdmin()
  const isSuperAdmin = useIsSuperAdmin()

  let navItems: NavItem[] = baseNavItems
  if (isAdmin) {
    navItems = [
      ...baseNavItems.slice(0, 4),
      { label: t('nav.coordinators'), path: '/coordinators', icon: Users },
      ...(isSuperAdmin ? [{ label: t('nav.admins'), path: '/admins', icon: ShieldAlert }] : []),
      ...baseNavItems.slice(4),
    ]
  }

  return (
    <SidebarProvider>
      <AppSidebar navItems={navItems} onLogout={handleLogout} userName={user?.name ?? ''} />

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ms-1" />
        </header>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-background p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
