---
name: createHook
description: "Creates a custom hook with 4 variants: query, mutation, utility, context. Use when: 'create a hook', 'I need a useAssignments hook', 'add a mutation hook for X', 'create a context hook', 'build a utility hook'."
user_invocable: true
---

# Create Hook Skill

You are creating a custom hook for the Shiba app. Follow the exact patterns from `useHomeStats.ts` (query), `useLogin.ts` (mutation), `useAuth.ts` (context), and `useIsAdmin.ts` (utility).

## Step 1: Gather Information

Ask the user for (skip if already provided):
1. **Hook name** (camelCase with `use` prefix, e.g., `useAssignments`)
2. **Type**: `query` | `mutation` | `utility` | `context`
3. **Scope**: feature-scoped or global?
   - **Feature-scoped** → `src/features/{feature}/hooks/use{Name}.ts`
   - **Global** → `src/hooks/use{Name}.ts`
4. **Feature name** (if feature-scoped)

**Type-specific info:**
- **query**: API function to call, query key parts, any `select` transformation needed?
- **mutation**: API function to call, success behavior (navigate? toast? invalidate queries?), error handling
- **utility**: What does it derive/compute? What hooks does it consume?
- **context**: What React Context does it wrap? (usually already exists)

## Step 2: Show Plan & Wait for Approval

Present the file plan. Example for a query hook:

```
Files to CREATE:
  src/features/assignments/hooks/useAssignments.ts

Files to MODIFY (if needed):
  src/features/assignments/api/assignments.api.ts    — Add API function (if not exists)
  src/features/assignments/types/assignments.types.ts — Add types (if not exists)
  src/features/assignments/index.ts                  — Add export (if public API)
  src/locales/en/assignments.json                    — Add toast messages (mutations only)
  src/locales/he/assignments.json                    — Add toast messages (mutations only)
```

**Wait for explicit user approval before writing any files.**

## Step 3: Read Before Modify

Before modifying any existing file, READ it first.

## Step 4: Create Hook

### Template A: Query Hook (like `useHomeStats`)

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetch{Feature}Data } from '../api/{feature}.api'
import type { {Feature}Data } from '../types/{feature}.types'

export function use{Name}(/* params if needed */) {
  return useQuery({
    queryKey: ['{feature}', '{operation}' /*, ...params */],
    queryFn: () => fetch{Feature}Data(/* params */),
    // Optional: select for data transformation
    // select: (raw): {Feature}Data => ({
    //   ...raw,
    //   // transform fields here
    // }),
  })
}
```

**Key rules:**
- Query keys follow `[featureName, operation, ...params]`
- Use `select` for data transformation (e.g., translating i18n keys)
- Add `enabled` guard if query depends on optional params:
  ```typescript
  enabled: !!requiredParam,
  ```
- If translation is needed in `select`, add `useTranslation`:
  ```typescript
  const { t } = useTranslation('{feature}')
  ```

### Template B: Mutation Hook (like `useLogin`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { create{Feature} } from '../api/{feature}.api'
import type { {Feature}FormData } from '../schemas/{feature}.schema'

export function use{Name}() {
  const { t } = useTranslation('{feature}')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {Feature}FormData) => create{Feature}(data),
    onSuccess: () => {
      toast.success(t('toast.{operation}Success'))
      queryClient.invalidateQueries({ queryKey: ['{feature}'] })
      navigate('/{feature}')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.{operation}Error')
      toast.error(message)
    },
  })
}
```

**Key rules:**
- Always invalidate related queries in `onSuccess`
- Error handling: check for Axios error with server message, fallback to i18n key
- Toast messages come from translation files
- Only include `useNavigate` if the mutation should redirect
- Only include `useQueryClient` if queries need invalidation

### Template C: Context Hook (like `useAuth`)

```typescript
import { useContext } from 'react'
import { {Feature}Context } from '../context/{Feature}Context'

export function use{Name}() {
  const context = useContext({Feature}Context)
  if (!context) {
    throw new Error('use{Name} must be used within a {Feature}Provider')
  }
  return context
}
```

### Template D: Utility Hook (like `useIsAdmin`)

```typescript
import { useAuth } from '@/features/auth'

export function use{Name}() {
  const { user } = useAuth()
  // Derive and return computed value
  return user?.role === 'SOME_ROLE'
}
```

**Key rules:**
- Utility hooks derive/compute values from other hooks
- No direct API calls — consume existing hooks only
- Keep them focused — one responsibility per hook
- Place in `src/hooks/` if globally useful, `src/features/{feature}/hooks/` if feature-specific

## Step 5: Update Related Files (if needed)

### Add API function (if it doesn't exist)

Read `src/features/{feature}/api/{feature}.api.ts` first, then add:

```typescript
export async function fetch{Operation}(): Promise<ResponseType> {
  const response = await apiClient.get<ResponseType>('/{feature}/{endpoint}')
  return response.data
}
```

### Add types (if needed)

Read `src/features/{feature}/types/{feature}.types.ts` first, then add new interfaces.

### Add toast translations (mutations only)

**English** — add to `src/locales/en/{feature}.json`:
```json
{
  "toast": {
    "{operation}Success": "Operation completed successfully",
    "{operation}Error": "Something went wrong. Please try again."
  }
}
```

**Hebrew** — add to `src/locales/he/{feature}.json`:
```json
{
  "toast": {
    "{operation}Success": "TODO: Hebrew translation",
    "{operation}Error": "TODO: Hebrew translation"
  }
}
```

### Add barrel export (if public API)

Read `src/features/{feature}/index.ts` first, then add:
```typescript
export { use{Name} } from './hooks/use{Name}'
```

## Conventions Enforced

- All toast/error messages via `useTranslation` — zero hardcoded strings
- Query keys: `[featureName, operation, ...params]`
- Always invalidate related queries in mutation `onSuccess`
- Error handling: Axios error check with server message fallback
- `function` declarations, never arrow functions for hooks
- Feature public API via `index.ts` only
- Path alias `@/` for all imports
