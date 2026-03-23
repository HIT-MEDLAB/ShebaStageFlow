import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  CalendarDays,
  ShieldCheck,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react'
import { AppSidebar } from '@/components/layout/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth'
import { useIsAdmin } from '@/hooks/useIsAdmin'
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
    { label: t('nav.assignments'), path: '/assignments', icon: CalendarDays },
    { label: t('nav.constraints'), path: '/constraints', icon: ShieldCheck },
    { label: t('nav.statistics'), path: '/statistics', icon: BarChart3 },
    { label: t('nav.settings'), path: '/settings', icon: Settings },
  ]

  const isAdmin = useIsAdmin()

  const navItems: NavItem[] = isAdmin
    ? [
        ...baseNavItems.slice(0, 4),
        { label: t('nav.coordinators'), path: '/coordinators', icon: Users },
        ...baseNavItems.slice(4),
      ]
    : baseNavItems

  return (
    <SidebarProvider>
      <AppSidebar navItems={navItems} onLogout={handleLogout} />

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-foreground">
            {user?.name ?? ''}
          </span>
        </header>

        <main className="flex-1 bg-background p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
