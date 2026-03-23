# Home Screen & Sidebar Design

## Context

The Shiba scheduling platform needs its main dashboard (Home Screen) and navigation sidebar. The home screen provides an at-a-glance overview of weekly/yearly scheduling data. The sidebar provides role-aware navigation. Currently only placeholder layout exists in `AppLayout.tsx`.

## Pre-requisites

1. **Add `role` to `AuthUser`** (`features/auth/types/auth.types.ts`) — string matching `Role` enum from backend
2. **Install Shadcn components**: card, table, select, toggle-group
3. **Add `home` i18n namespace** with translations in both `en` and `he`

## File Structure

```
src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx          # UPDATE — wire Sidebar + header
│       └── Sidebar.tsx            # NEW — presentational nav component
├── features/
│   └── home/
│       ├── api/
│       │   └── home.api.ts        # Mock API functions
│       ├── components/
│       │   ├── StatsCard.tsx       # Single stat card (title, value, icon)
│       │   ├── UniversityTable.tsx # University data table
│       │   └── WeekSelector.tsx    # Week picker dropdown
│       ├── hooks/
│       │   └── useHomeStats.ts    # TanStack Query hook (mock data)
│       ├── pages/
│       │   └── HomePage.tsx       # Orchestrator — replaces App.tsx
│       ├── types/
│       │   └── home.types.ts      # HomeStats, UniversityRow types
│       └── index.ts               # Public exports
```

## Components

### Sidebar (`components/layout/Sidebar.tsx`)

Dumb presentational component. Receives `navItems` array as props.

**Props:**
```ts
interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}
interface SidebarProps {
  navItems: NavItem[]
}
```

**Nav items (all roles):** Home, Assignments, Constraints, Statistics, Settings
**Admin/Super Admin only:** Academic Coordinators

Uses `NavLink` from react-router for active state. RTL-aware with logical CSS (`ps-`, `pe-`).

### AppLayout (updated)

Orchestrates sidebar by building `navItems` array based on `user.role` from auth store. Passes items to `Sidebar`.

### StatsCard (`features/home/components/StatsCard.tsx`)

Props: `title: string`, `value: string | number`, `icon: LucideIcon`

Renders a Shadcn Card with icon, title text, and large value. No business logic.

### WeekSelector (`features/home/components/WeekSelector.tsx`)

Props: `weeks: Week[]`, `selectedWeek: number`, `onChange: (week: number) => void`

Shadcn Select dropdown showing week number + date range.

### UniversityTable (`features/home/components/UniversityTable.tsx`)

Props: `rows: UniversityRow[]`

Columns: Institution Name, Total Students, Morning Rotations, Evening Rotations.

### HomePage (`features/home/pages/HomePage.tsx`)

Orchestrator page. Calls `useHomeStats` hook. Checks user role for weekly/yearly toggle visibility. Passes data to dumb components.

## Types

```ts
interface HomeStats {
  activeStudents: number
  morningRotations: number
  eveningRotations: number
  activeDepartments: number
}

interface UniversityRow {
  id: number
  name: string
  totalStudents: number
  morningRotations: number
  eveningRotations: number
}

interface Week {
  weekNumber: number
  startDate: string
  endDate: string
}
```

## Data Flow

```
HomePage
  ├─ useHomeStats(selectedWeek, viewMode) → { stats, universityRows, weeks }
  ├─ 4 × StatsCard (each gets title + value + icon)
  ├─ WeekSelector (weeks list, selected, onChange)
  ├─ ViewToggle (admin only — weekly/yearly)
  └─ UniversityTable (rows)
```

## Role-Based Rendering

- **Sidebar**: AppLayout reads `user.role`. SUPER_ADMIN/ADMIN see "Academic Coordinators" nav link.
- **Home toggle**: HomePage reads `user.role`. SUPER_ADMIN/ADMIN see weekly/yearly toggle. ACADEMIC_COORDINATOR sees weekly only.

## i18n

New `home` namespace with keys for: card titles, table headers, week selector label, toggle labels, page title.

## Mock Data

`home.api.ts` returns hardcoded mock data. `useHomeStats` wraps it with `useQuery`. When backend endpoints are ready, only `home.api.ts` needs updating.
