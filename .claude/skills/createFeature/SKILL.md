---
name: createFeature
description: "Bootstraps an entire feature slice with all required files following Feature-Sliced Design. Use when: 'create a new feature', 'add the assignments feature', 'scaffold the constraints module', 'build the statistics feature', 'I need a new feature for X'."
user_invocable: true
---

# Create Feature Skill

You are scaffolding a new feature slice for the Shiba app. Follow the exact patterns from the existing `home` and `auth` features.

## Step 1: Gather Information

Ask the user for (skip if already provided):
1. **Feature name** (kebab-case, e.g., `assignments`) — derive PascalCase (`Assignments`) and camelCase (`assignments`) automatically
2. **Brief description** (for the page title and translation context)
3. **Needs forms?** (yes = include schemas/ directory with Zod factory pattern)

## Step 2: Show Plan & Wait for Approval

Present the file plan to the user. Example for feature `assignments` with forms:

```
Files to CREATE:
  src/features/assignments/api/assignments.api.ts
  src/features/assignments/hooks/useAssignmentsData.ts
  src/features/assignments/pages/AssignmentsPage.tsx
  src/features/assignments/types/assignments.types.ts
  src/features/assignments/schemas/assignments.schema.ts  (only if forms needed)
  src/features/assignments/index.ts
  src/locales/en/assignments.json
  src/locales/he/assignments.json

Files to MODIFY:
  src/lib/i18n.ts           — Register namespace
  src/app/router.tsx        — Add route under ProtectedRoute > AppLayout
```

**Wait for explicit user approval before writing any files.**

## Step 3: Read Before Modify

Before modifying any existing file, READ it first:
- `src/lib/i18n.ts`
- `src/app/router.tsx`

## Step 4: Create Files

Use `{feature}` for kebab-case name, `{Feature}` for PascalCase, `{featureCamel}` for camelCase throughout.

### 4.1 Types — `src/features/{feature}/types/{feature}.types.ts`

```typescript
// Add starter types for the feature.
// Follow the pattern from home.types.ts — separate Raw (API response) from display types.

export interface {Feature}Item {
  id: string
  // TODO: Add feature-specific fields
}
```

### 4.2 API — `src/features/{feature}/api/{feature}.api.ts`

```typescript
import { apiClient } from '@/lib/apiClient'
import type { {Feature}Item } from '../types/{feature}.types'

// TODO: Replace mock with real API call
// e.g. const response = await apiClient.get<{Feature}Item[]>('/{feature}')
export async function fetch{Feature}Data(): Promise<{Feature}Item[]> {
  return []
}
```

If forms are needed, add a mutation function:

```typescript
export async function create{Feature}(data: unknown): Promise<{Feature}Item> {
  const response = await apiClient.post<{Feature}Item>('/{feature}', data)
  return response.data
}
```

### 4.3 Hook — `src/features/{feature}/hooks/use{Feature}Data.ts`

Follow the `useHomeStats` pattern exactly:

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetch{Feature}Data } from '../api/{feature}.api'

export function use{Feature}Data() {
  return useQuery({
    queryKey: ['{feature}', 'list'],
    queryFn: fetch{Feature}Data,
  })
}
```

### 4.4 Schema (if forms needed) — `src/features/{feature}/schemas/{feature}.schema.ts`

Follow the `auth.schema.ts` factory pattern exactly:

```typescript
import { z } from 'zod'
import type { TFunction } from 'i18next'

export function create{Feature}Schema(t: TFunction) {
  return z.object({
    // TODO: Add form fields with translated validation messages
    // Example: name: z.string().min(1, t('{feature}:validation.nameRequired')),
  })
}

export type {Feature}FormData = z.infer<ReturnType<typeof create{Feature}Schema>>
```

### 4.5 Page — `src/features/{feature}/pages/{Feature}Page.tsx`

Follow the `HomePage` orchestrator pattern:

```typescript
import { useTranslation } from 'react-i18next'
import { use{Feature}Data } from '../hooks/use{Feature}Data'

export function {Feature}Page() {
  const { t } = useTranslation('{feature}')
  const { data, isLoading } = use{Feature}Data()

  if (isLoading || !data) {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t('pageTitle')}
      </h1>
      {/* TODO: Add feature UI components */}
    </div>
  )
}
```

### 4.6 Barrel — `src/features/{feature}/index.ts`

```typescript
export { {Feature}Page } from './pages/{Feature}Page'
```

Add more exports as hooks/types/schemas are needed by other features.

### 4.7 English translations — `src/locales/en/{feature}.json`

```json
{
  "pageTitle": "{Feature Title}"
}
```

Add keys as needed. Structure mirrors `home.json` pattern (flat namespace with nested groups).

### 4.8 Hebrew translations — `src/locales/he/{feature}.json`

```json
{
  "pageTitle": "TODO: Hebrew translation for {Feature Title}"
}
```

Use descriptive TODO placeholders for Hebrew values the developer needs to provide.

## Step 5: Modify Existing Files

### 5.1 Register i18n namespace — `src/lib/i18n.ts`

Add THREE things (read file first, find exact insertion points):

1. **Import lines** — add after the last `import he...` line:
   ```typescript
   import en{Feature} from '@/locales/en/{feature}.json'
   import he{Feature} from '@/locales/he/{feature}.json'
   ```

2. **Resources** — add to both `en` and `he` objects:
   ```typescript
   en: { common: enCommon, auth: enAuth, home: enHome, {feature}: en{Feature} },
   he: { common: heCommon, auth: heAuth, home: heHome, {feature}: he{Feature} },
   ```

3. **Namespace array** — add to `ns`:
   ```typescript
   ns: ['common', 'auth', 'home', '{feature}'],
   ```

### 5.2 Add route — `src/app/router.tsx`

Add the route inside `ProtectedRoute > AppLayout > children`:

1. **Import** — add at top:
   ```typescript
   import { {Feature}Page } from '@/features/{feature}'
   ```

2. **Route** — add as a new child of AppLayout:
   ```typescript
   {
     path: '/{feature}',
     element: <{Feature}Page />,
   },
   ```

## Conventions Enforced

- All user-facing text via `useTranslation` — zero hardcoded strings
- RTL: use logical CSS properties (`ps-`/`pe-`/`start-`/`end-`), never `pl-`/`pr-`/`left-`/`right-`
- Path alias `@/` for all imports
- Feature public API via `index.ts` only
- Query keys: `[featureName, operation, ...params]`
- `interface` for props, `function` declarations for components/hooks
- `LucideIcon` type for icon props
