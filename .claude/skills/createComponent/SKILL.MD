---
name: createComponent
description: "Creates a dumb presentational component following project conventions. Use when: 'create a component', 'I need a StudentCard component', 'add a DataTable component', 'make a reusable card for X', 'build a shared component'."
user_invocable: true
---

# Create Component Skill

You are creating a dumb presentational component for the Shiba app. Follow the exact patterns from `StatsCard.tsx` and `UniversityTable.tsx`.

## Step 1: Gather Information

Ask the user for (skip if already provided):
1. **Component name** (PascalCase, e.g., `StudentCard`)
2. **Scope**: feature-scoped or shared?
   - **Feature-scoped** → `src/features/{feature}/components/{Component}.tsx`
   - **Shared** → `src/components/shared/{Component}.tsx`
3. **Feature name** (if feature-scoped)
4. **Props description** — what data does it display? What callbacks does it need?
5. **Has its own i18n keys?** (e.g., table headers like `UniversityTable`) — if yes, which feature namespace?

## Step 2: Show Plan & Wait for Approval

Present the file plan. Example for feature-scoped `AssignmentCard`:

```
Files to CREATE:
  src/features/assignments/components/AssignmentCard.tsx

Files to MODIFY (if i18n keys needed):
  src/locales/en/assignments.json  — Add component-specific keys
  src/locales/he/assignments.json  — Add component-specific keys
```

**Wait for explicit user approval before writing any files.**

## Step 3: Read Before Modify

If modifying translation files, READ them first.

## Step 4: Create Component

### Rules (non-negotiable)

1. **Zero business logic** — no data fetching, no API calls, no complex state management
2. **All data via props** — every piece of data and every callback comes through props
3. **`interface` for props** — never `type`, always `interface {Component}Props`
4. **Function declarations** — `export function Component()`, never arrow functions for components
5. **`cn()` for conditional classes** — import from `@/lib/utils`
6. **Logical CSS properties for RTL** — use `ps-`/`pe-`/`start-`/`end-`/`ms-`/`me-`, NEVER `pl-`/`pr-`/`left-`/`right-`/`ml-`/`mr-`
7. **React 19 ref-as-prop** — if component accepts ref, type it as `ref?: React.Ref<HTMLElement>` in the props interface. Do NOT use `forwardRef`
8. **`LucideIcon` type for icon props** — `import type { LucideIcon } from 'lucide-react'`
9. **No `useTranslation` unless the component owns translation keys** (like table headers). If it does, the namespace must be passed or hardcoded to the feature namespace
10. **Shadcn/UI primitives** — use `Card`, `Table`, `Button` etc. from `@/components/ui/`

### Template A: Pure Props Component (like `StatsCard`)

For components that receive ALL display data as pre-translated props:

```typescript
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface {Component}Props {
  title: string
  value: number
  icon: LucideIcon
}

export function {Component}({ title, value, icon: Icon }: {Component}Props) {
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

### Template B: Component with Own i18n Keys (like `UniversityTable`)

For components that have their own translation keys (e.g., table column headers):

```typescript
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SomeRow } from '../types/{feature}.types'

interface {Component}Props {
  rows: SomeRow[]
}

export function {Component}({ rows }: {Component}Props) {
  const { t } = useTranslation('{feature}')

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('{component}.noData')}
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('{component}.columnName')}</TableHead>
            {/* ... more columns */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              {/* ... more cells */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Template C: Component with Callbacks

For components that need event handlers (all passed as props):

```typescript
interface {Component}Props {
  items: SomeType[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
}

export function {Component}({ items, selectedId, onSelect, onDelete }: {Component}Props) {
  return (
    // ... JSX using cn() for conditional active states
  )
}
```

## Step 5: Update Translation Files (if needed)

If the component has its own i18n keys, add them to the feature's translation files.

**English** — `src/locales/en/{feature}.json`:
```json
{
  "{component}": {
    "columnName": "Column Name",
    "noData": "No data available"
  }
}
```

**Hebrew** — `src/locales/he/{feature}.json`:
```json
{
  "{component}": {
    "columnName": "TODO: Hebrew translation",
    "noData": "TODO: Hebrew translation"
  }
}
```

## Conventions Enforced

- Zero hardcoded text — all user-facing strings via props or `useTranslation`
- RTL: logical CSS properties only
- Path alias `@/` for imports
- `interface` for props, `function` declarations
- `cn()` from `@/lib/utils` for conditional classes
- `LucideIcon` type for icon props
- React 19 ref-as-prop (no `forwardRef`)
- Shadcn/UI primitives for UI building blocks
