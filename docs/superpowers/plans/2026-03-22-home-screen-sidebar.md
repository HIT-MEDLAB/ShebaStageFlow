# Home Screen & Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the main dashboard (Home Screen) with 4 stat cards, a university table with week selector and role-based weekly/yearly toggle, plus a navigation sidebar with role-aware links.

**Architecture:** Feature-first structure per CLAUDE.md. Sidebar is a shared layout component. Home screen lives in `features/home/`. All components are dumb/presentational — pages orchestrate. Data flows through TanStack Query hooks calling mock API functions. Role checked via `useAuthStore`.

**Tech Stack:** React 19, Tailwind v4, Shadcn/UI (card, table, select, toggle-group), Lucide icons, TanStack Query v5, Zustand v5, react-i18next, React Router v7.

**Spec:** `docs/superpowers/specs/2026-03-22-home-screen-sidebar-design.md`

---

### Task 1: Add `role` to AuthUser type and update auth store

**Files:**
- Modify: `client/src/features/auth/types/auth.types.ts`

- [ ] **Step 1: Add role to AuthUser interface**

```ts
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACADEMIC_COORDINATOR'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}
```

- [ ] **Step 2: Verify the app still compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`
Expected: No errors (role is a new optional-ish field — existing code only reads `id`, `email`, `name`)

- [ ] **Step 3: Commit**

```bash
git add client/src/features/auth/types/auth.types.ts
git commit -m "feat(auth): add role field to AuthUser type"
```

---

### Task 2: Install Shadcn UI components

**Files:**
- Create: `client/src/components/ui/card.tsx`
- Create: `client/src/components/ui/table.tsx`
- Create: `client/src/components/ui/select.tsx`
- Create: `client/src/components/ui/toggle-group.tsx`
- Create: `client/src/components/ui/toggle.tsx`

- [ ] **Step 1: Install components via Shadcn CLI**

Run: `cd /Users/klutz/Desktop/shiba/client && npx shadcn@latest add card table select toggle-group --yes`

- [ ] **Step 2: Verify files were created**

Check that these files exist:
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/toggle-group.tsx`
- `src/components/ui/toggle.tsx`

- [ ] **Step 3: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ui/
git commit -m "feat(ui): install shadcn card, table, select, toggle-group components"
```

---

### Task 3: Add i18n translations for home and sidebar

**Files:**
- Modify: `client/src/locales/en/common.json`
- Modify: `client/src/locales/he/common.json`
- Create: `client/src/locales/en/home.json`
- Create: `client/src/locales/he/home.json`
- Modify: `client/src/lib/i18n.ts`

- [ ] **Step 1: Create English home translations**

Create `client/src/locales/en/home.json`:

```json
{
  "pageTitle": "Home",
  "cards": {
    "activeStudents": "Active Students",
    "morningRotations": "Morning Rotations",
    "eveningRotations": "Evening Rotations",
    "activeDepartments": "Active Departments"
  },
  "table": {
    "title": "Weekly University Information",
    "yearlyTitle": "Yearly University Information",
    "institutionName": "Institution Name",
    "totalStudents": "Total Students",
    "morningRotations": "Morning Rotations",
    "eveningRotations": "Evening Rotations",
    "noData": "No data available"
  },
  "weekSelector": {
    "label": "Select Week",
    "week": "Week {{number}}",
    "weekRange": "Week {{number}} ({{start}} - {{end}})"
  },
  "viewToggle": {
    "weekly": "Weekly",
    "yearly": "Yearly"
  }
}
```

- [ ] **Step 2: Create Hebrew home translations**

Create `client/src/locales/he/home.json`:

```json
{
  "pageTitle": "דף הבית",
  "cards": {
    "activeStudents": "סטודנטים פעילים",
    "morningRotations": "סבבי בוקר",
    "eveningRotations": "סבבי ערב",
    "activeDepartments": "מחלקות פעילות"
  },
  "table": {
    "title": "מידע שבועי על האוניברסיטאות",
    "yearlyTitle": "מידע שנתי על האוניברסיטאות",
    "institutionName": "שם המוסד",
    "totalStudents": "סה״כ סטודנטים",
    "morningRotations": "מספר סבבי בוקר",
    "eveningRotations": "מספר סבבי ערב",
    "noData": "אין נתונים להצגה"
  },
  "weekSelector": {
    "label": "בחירת שבוע",
    "week": "שבוע {{number}}",
    "weekRange": "שבוע {{number}} ({{start}} - {{end}})"
  },
  "viewToggle": {
    "weekly": "שבועי",
    "yearly": "שנתי"
  }
}
```

- [ ] **Step 3: Add sidebar nav translations to common.json**

Update `client/src/locales/en/common.json` — replace `nav` section:

```json
{
  "appName": "Shiba",
  "nav": {
    "home": "Home",
    "assignments": "Assignments",
    "constraints": "Constraints",
    "statistics": "Statistics",
    "settings": "Settings",
    "coordinators": "Academic Coordinators"
  },
  "home": {
    "welcomeBack": "Welcome back, {{name}}!",
    "welcomeBackDefault": "Welcome back!",
    "signedIn": "You are signed in to the Shiba system.",
    "signOut": "Sign Out"
  },
  "comingSoon": "{{feature}} — Coming Soon",
  "forgotPassword": "Forgot Password"
}
```

Update `client/src/locales/he/common.json` — replace `nav` section:

```json
{
  "appName": "שיבא",
  "nav": {
    "home": "דף הבית",
    "assignments": "לוח שיבוצים",
    "constraints": "אילוצים",
    "statistics": "סטטיסטיקות",
    "settings": "הגדרות",
    "coordinators": "רכזים אקדמיים"
  },
  "home": {
    "welcomeBack": "!ברוך שובך, {{name}}",
    "welcomeBackDefault": "!ברוך שובך",
    "signedIn": "אתה מחובר למערכת שיבא.",
    "signOut": "התנתק"
  },
  "comingSoon": "{{feature}} — בקרוב",
  "forgotPassword": "שכחתי סיסמה"
}
```

- [ ] **Step 4: Register home namespace in i18n.ts**

Modify `client/src/lib/i18n.ts` — add imports and register:

```ts
import enHome from '@/locales/en/home.json'
import heHome from '@/locales/he/home.json'

// In resources:
en: { common: enCommon, auth: enAuth, home: enHome },
he: { common: heCommon, auth: heAuth, home: heHome },

// In ns array:
ns: ['common', 'auth', 'home'],
```

- [ ] **Step 5: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add client/src/locales/ client/src/lib/i18n.ts
git commit -m "feat(i18n): add home and sidebar translations for en and he"
```

---

### Task 4: Create Sidebar component

**Files:**
- Create: `client/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `client/src/components/layout/Sidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

interface SidebarProps {
  navItems: NavItem[]
}

export function Sidebar({ navItems }: SidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="hidden w-64 flex-col border-e border-border bg-card md:flex">
      <div className="flex h-14 items-center border-b border-border px-6">
        <h2 className="text-lg font-semibold text-foreground">{t('appName')}</h2>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/Sidebar.tsx
git commit -m "feat(layout): create Sidebar navigation component"
```

---

### Task 5: Update AppLayout to wire Sidebar with role-based nav

**Files:**
- Modify: `client/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Replace AppLayout with sidebar integration**

Replace entire content of `client/src/components/layout/AppLayout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  CalendarDays,
  ShieldCheck,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { NavItem } from '@/components/layout/Sidebar'

export function AppLayout() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const baseNavItems: NavItem[] = [
    { label: t('nav.home'), path: '/home', icon: Home },
    { label: t('nav.assignments'), path: '/assignments', icon: CalendarDays },
    { label: t('nav.constraints'), path: '/constraints', icon: ShieldCheck },
    { label: t('nav.statistics'), path: '/statistics', icon: BarChart3 },
    { label: t('nav.settings'), path: '/settings', icon: Settings },
  ]

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const navItems: NavItem[] = isAdmin
    ? [
        ...baseNavItems.slice(0, 4),
        { label: t('nav.coordinators'), path: '/coordinators', icon: Users },
        ...baseNavItems.slice(4),
      ]
    : baseNavItems

  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} />

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border bg-card px-6">
          <span className="text-sm font-medium text-foreground">
            {user?.name ?? ''}
          </span>
        </header>

        <main className="flex-1 bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/AppLayout.tsx
git commit -m "feat(layout): wire Sidebar into AppLayout with role-based nav items"
```

---

### Task 6: Create home feature types

**Files:**
- Create: `client/src/features/home/types/home.types.ts`

- [ ] **Step 1: Create types file**

Create `client/src/features/home/types/home.types.ts`:

```ts
export interface HomeStats {
  activeStudents: number
  morningRotations: number
  eveningRotations: number
  activeDepartments: number
}

export interface UniversityRow {
  id: number
  name: string
  totalStudents: number
  morningRotations: number
  eveningRotations: number
}

export interface Week {
  weekNumber: number
  startDate: string
  endDate: string
}

export type ViewMode = 'weekly' | 'yearly'

export interface HomeData {
  stats: HomeStats
  universityRows: UniversityRow[]
  weeks: Week[]
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/home/types/home.types.ts
git commit -m "feat(home): add home feature type definitions"
```

---

### Task 7: Create mock API and TanStack Query hook

**Files:**
- Create: `client/src/features/home/api/home.api.ts`
- Create: `client/src/features/home/hooks/useHomeStats.ts`

- [ ] **Step 1: Create mock API**

Create `client/src/features/home/api/home.api.ts`:

```ts
import type { HomeData, ViewMode } from '../types/home.types'

// Mock data — replace with real API calls when backend is ready
// e.g. const response = await apiClient.get<HomeData>('/home/stats', { params: { week, viewMode } })
export async function fetchHomeData(
  week: number,
  viewMode: ViewMode
): Promise<HomeData> {
  const isYearly = viewMode === 'yearly'

  return {
    stats: {
      activeStudents: isYearly ? 1430 : 230,
      morningRotations: isYearly ? 39 : 8,
      eveningRotations: isYearly ? 23 : 4,
      activeDepartments: isYearly ? 12 : 12,
    },
    universityRows: [
      {
        id: 1,
        name: 'אוניברסיטת תל אביב',
        totalStudents: isYearly ? 450 : 85,
        morningRotations: isYearly ? 12 : 3,
        eveningRotations: isYearly ? 8 : 2,
      },
      {
        id: 2,
        name: 'אוניברסיטת רייכמן',
        totalStudents: isYearly ? 300 : 60,
        morningRotations: isYearly ? 10 : 2,
        eveningRotations: isYearly ? 6 : 1,
      },
      {
        id: 3,
        name: 'אוניברסיטת בן גוריון',
        totalStudents: isYearly ? 350 : 50,
        morningRotations: isYearly ? 8 : 2,
        eveningRotations: isYearly ? 4 : 1,
      },
      {
        id: 4,
        name: 'הטכניון',
        totalStudents: isYearly ? 330 : 35,
        morningRotations: isYearly ? 9 : 1,
        eveningRotations: isYearly ? 5 : 0,
      },
    ],
    weeks: [
      { weekNumber: 1, startDate: '2026-03-01', endDate: '2026-03-05' },
      { weekNumber: 2, startDate: '2026-03-08', endDate: '2026-03-12' },
      { weekNumber: 3, startDate: '2026-03-15', endDate: '2026-03-19' },
      { weekNumber: 4, startDate: '2026-03-22', endDate: '2026-03-26' },
      { weekNumber: 5, startDate: '2026-03-29', endDate: '2026-04-02' },
    ],
  }
}
```

- [ ] **Step 2: Create TanStack Query hook**

Create `client/src/features/home/hooks/useHomeStats.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchHomeData } from '../api/home.api'
import type { ViewMode } from '../types/home.types'

export function useHomeStats(week: number, viewMode: ViewMode) {
  return useQuery({
    queryKey: ['home', 'stats', week, viewMode],
    queryFn: () => fetchHomeData(week, viewMode),
  })
}
```

- [ ] **Step 3: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add client/src/features/home/api/ client/src/features/home/hooks/
git commit -m "feat(home): add mock API and useHomeStats query hook"
```

---

### Task 8: Create StatsCard component

**Files:**
- Create: `client/src/features/home/components/StatsCard.tsx`

- [ ] **Step 1: Create StatsCard**

Create `client/src/features/home/components/StatsCard.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
}

export function StatsCard({ title, value, icon: Icon }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            {value.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add client/src/features/home/components/StatsCard.tsx
git commit -m "feat(home): create StatsCard presentational component"
```

---

### Task 9: Create WeekSelector component

**Files:**
- Create: `client/src/features/home/components/WeekSelector.tsx`

- [ ] **Step 1: Create WeekSelector**

Create `client/src/features/home/components/WeekSelector.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Week } from '../types/home.types'

interface WeekSelectorProps {
  weeks: Week[]
  selectedWeek: number
  onChange: (week: number) => void
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onChange,
}: WeekSelectorProps) {
  const { t } = useTranslation('home')

  return (
    <Select
      value={String(selectedWeek)}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('weekSelector.label')} />
      </SelectTrigger>
      <SelectContent>
        {weeks.map((week) => (
          <SelectItem key={week.weekNumber} value={String(week.weekNumber)}>
            {t('weekSelector.weekRange', {
              number: week.weekNumber,
              start: week.startDate,
              end: week.endDate,
            })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 2: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add client/src/features/home/components/WeekSelector.tsx
git commit -m "feat(home): create WeekSelector dropdown component"
```

---

### Task 10: Create UniversityTable component

**Files:**
- Create: `client/src/features/home/components/UniversityTable.tsx`

- [ ] **Step 1: Create UniversityTable**

Create `client/src/features/home/components/UniversityTable.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UniversityRow } from '../types/home.types'

interface UniversityTableProps {
  rows: UniversityRow[]
}

export function UniversityTable({ rows }: UniversityTableProps) {
  const { t } = useTranslation('home')

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('table.noData')}
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.institutionName')}</TableHead>
            <TableHead>{t('table.totalStudents')}</TableHead>
            <TableHead>{t('table.morningRotations')}</TableHead>
            <TableHead>{t('table.eveningRotations')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.totalStudents.toLocaleString()}</TableCell>
              <TableCell>{row.morningRotations}</TableCell>
              <TableCell>{row.eveningRotations}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 2: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add client/src/features/home/components/UniversityTable.tsx
git commit -m "feat(home): create UniversityTable presentational component"
```

---

### Task 11: Create HomePage orchestrator and wire routing

**Files:**
- Create: `client/src/features/home/pages/HomePage.tsx`
- Create: `client/src/features/home/index.ts`
- Modify: `client/src/app/router.tsx`
- Delete: `client/src/app/App.tsx` (replaced by HomePage)

- [ ] **Step 1: Create HomePage**

Create `client/src/features/home/pages/HomePage.tsx`:

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Sun, Moon, Building2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useHomeStats } from '../hooks/useHomeStats'
import { StatsCard } from '../components/StatsCard'
import { WeekSelector } from '../components/WeekSelector'
import { UniversityTable } from '../components/UniversityTable'
import type { ViewMode } from '../types/home.types'

export function HomePage() {
  const { t } = useTranslation('home')
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  const [selectedWeek, setSelectedWeek] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  const { data, isLoading } = useHomeStats(selectedWeek, viewMode)

  if (isLoading || !data) {
    return null
  }

  const cards = [
    {
      title: t('cards.activeStudents'),
      value: data.stats.activeStudents,
      icon: GraduationCap,
    },
    {
      title: t('cards.morningRotations'),
      value: data.stats.morningRotations,
      icon: Sun,
    },
    {
      title: t('cards.eveningRotations'),
      value: data.stats.eveningRotations,
      icon: Moon,
    },
    {
      title: t('cards.activeDepartments'),
      value: data.stats.activeDepartments,
      icon: Building2,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {viewMode === 'weekly' ? t('table.title') : t('table.yearlyTitle')}
        </h2>

        <div className="flex items-center gap-4">
          {viewMode === 'weekly' && (
            <WeekSelector
              weeks={data.weeks}
              selectedWeek={selectedWeek}
              onChange={setSelectedWeek}
            />
          )}

          {isAdmin && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(val) => {
                if (val) setViewMode(val as ViewMode)
              }}
            >
              <ToggleGroupItem value="weekly" aria-label={t('viewToggle.weekly')}>
                {t('viewToggle.weekly')}
              </ToggleGroupItem>
              <ToggleGroupItem value="yearly" aria-label={t('viewToggle.yearly')}>
                {t('viewToggle.yearly')}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

        <UniversityTable rows={data.universityRows} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create public index**

Create `client/src/features/home/index.ts`:

```ts
export { HomePage } from './pages/HomePage'
```

- [ ] **Step 3: Update router to use HomePage instead of App**

Replace entire content of `client/src/app/router.tsx`:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { GuestRoute } from '@/components/shared/GuestRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/features/home'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/home',
            element: <HomePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
```

- [ ] **Step 4: Delete old App.tsx**

Delete `client/src/app/App.tsx` — it's fully replaced by HomePage.

- [ ] **Step 5: Verify app compiles**

Run: `cd /Users/klutz/Desktop/shiba/client && npx tsc --noEmit`

- [ ] **Step 6: Verify app renders in browser**

Run: `cd /Users/klutz/Desktop/shiba/client && npm run dev`
Open browser and verify:
- Sidebar shows with nav links
- Home screen shows 4 stat cards
- University table renders with mock data
- Week selector works
- (If logged in as admin) weekly/yearly toggle appears

- [ ] **Step 7: Commit**

```bash
git add client/src/features/home/ client/src/app/router.tsx
git rm client/src/app/App.tsx
git commit -m "feat(home): create HomePage with stats cards, university table, and week selector"
```
