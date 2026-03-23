---
name: createScreen
description: "Creates a new page/screen within a feature. Use when: 'create a screen', 'add the assignments screen', 'build the constraints page', 'I need a new page for X', 'add a form page for Y', 'create the settings screen'."
user_invocable: true
---

# Create Screen Skill

You are creating a new page/screen within a feature for the Shiba app. Follow the exact patterns from `HomePage.tsx` (data display) and `LoginPage.tsx` (form).

## Step 1: Check Feature Exists

Check if the feature directory exists at `src/features/{feature}/`. If it does NOT exist, use the `createFeature` skill logic to bootstrap the entire feature first, then continue with the screen creation.

## Step 2: Gather Information

Ask the user for (skip if already provided):
1. **Feature name** (kebab-case, e.g., `assignments`)
2. **Screen name** (PascalCase, e.g., `AssignmentDetail`)
3. **Route path** (e.g., `/assignments/:id`)
4. **Mode**: `data-display` or `form`?
   - **Data-display** (like HomePage): fetches data, renders via dumb components
   - **Form** (like LoginPage): React Hook Form + Zod schema + mutation
5. **Route params?** (e.g., `:id` — affects hook params and `useParams`)
6. **Add sidebar nav entry?** (yes/no — not all pages need nav entries, e.g., detail pages)

## Step 3: Show Plan & Wait for Approval

Present the file plan. Example for a data-display screen `AssignmentDetail`:

```
Files to CREATE:
  src/features/assignments/pages/AssignmentDetailPage.tsx
  src/features/assignments/hooks/useAssignmentDetail.ts

Files to MODIFY:
  src/features/assignments/api/assignments.api.ts      — Add fetch function
  src/features/assignments/types/assignments.types.ts   — Add types
  src/features/assignments/index.ts                     — Add page export
  src/locales/en/assignments.json                       — Add page keys
  src/locales/he/assignments.json                       — Add page keys
  src/app/router.tsx                                    — Add route
```

For a form screen, also include:
```
  src/features/assignments/schemas/assignments.schema.ts — Add schema factory
  src/features/assignments/hooks/useCreateAssignment.ts  — Add mutation hook
```

**Wait for explicit user approval before writing any files.**

## Step 4: Read Before Modify

Before modifying any existing file, READ it first:
- `src/features/{feature}/api/{feature}.api.ts`
- `src/features/{feature}/types/{feature}.types.ts`
- `src/features/{feature}/schemas/{feature}.schema.ts` (if form mode)
- `src/features/{feature}/index.ts`
- `src/locales/en/{feature}.json`
- `src/locales/he/{feature}.json`
- `src/app/router.tsx`
- `src/components/layout/AppLayout.tsx` (if adding nav entry)

## Step 5: Create Files

### Mode A: Data-Display Page (like `HomePage`)

#### 5A.1 Query Hook — `src/features/{feature}/hooks/use{Screen}.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetch{Screen}Data } from '../api/{feature}.api'

export function use{Screen}(/* params */) {
  return useQuery({
    queryKey: ['{feature}', '{screen}' /*, ...params */],
    queryFn: () => fetch{Screen}Data(/* params */),
  })
}
```

If the page has route params:
```typescript
import { useParams } from 'react-router-dom'

export function use{Screen}() {
  const { id } = useParams<{ id: string }>()

  return useQuery({
    queryKey: ['{feature}', '{screen}', id],
    queryFn: () => fetch{Screen}Data(id!),
    enabled: !!id,
  })
}
```

#### 5A.2 Page — `src/features/{feature}/pages/{Screen}Page.tsx`

```typescript
import { useTranslation } from 'react-i18next'
import { use{Screen} } from '../hooks/use{Screen}'

export function {Screen}Page() {
  const { t } = useTranslation('{feature}')
  const { data, isLoading } = use{Screen}()

  if (isLoading || !data) {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t('{screen}.pageTitle')}
      </h1>
      {/* TODO: Add dumb components, pass data as props */}
    </div>
  )
}
```

### Mode B: Form Page (like `LoginPage`)

#### 5B.1 Schema Factory — add to `src/features/{feature}/schemas/{feature}.schema.ts`

```typescript
export function create{Screen}Schema(t: TFunction) {
  return z.object({
    // TODO: Add form fields with translated validation
    // name: z.string().min(1, t('{feature}:validation.nameRequired')),
  })
}

export type {Screen}FormData = z.infer<ReturnType<typeof create{Screen}Schema>>
```

#### 5B.2 Mutation Hook — `src/features/{feature}/hooks/use{Screen}Submit.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import { submit{Screen} } from '../api/{feature}.api'
import type { {Screen}FormData } from '../schemas/{feature}.schema'

export function use{Screen}Submit() {
  const { t } = useTranslation('{feature}')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {Screen}FormData) => submit{Screen}(data),
    onSuccess: () => {
      toast.success(t('toast.{screen}Success'))
      queryClient.invalidateQueries({ queryKey: ['{feature}'] })
      navigate('/{feature}')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.{screen}Error')
      toast.error(message)
    },
  })
}
```

#### 5B.3 Form Page — `src/features/{feature}/pages/{Screen}Page.tsx`

```typescript
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { use{Screen}Submit } from '../hooks/use{Screen}Submit'
import { create{Screen}Schema, type {Screen}FormData } from '../schemas/{feature}.schema'

export function {Screen}Page() {
  const { t, i18n } = useTranslation('{feature}')
  const { mutate: submit, isPending } = use{Screen}Submit()

  const schema = useMemo(() => create{Screen}Schema(t), [i18n.language])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{Screen}FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      // TODO: Set default values matching schema fields
    },
  })

  function onSubmit(data: {Screen}FormData) {
    submit(data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t('{screen}.pageTitle')}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* TODO: Add form fields following LoginPage pattern */}
        {/* Each field: label + input + error message */}
        {/* Use t('{screen}.fieldLabel') for labels */}
        {/* Use t('{screen}.fieldPlaceholder') for placeholders */}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? t('{screen}.submitting') : t('{screen}.submit')}
        </Button>
      </form>
    </div>
  )
}
```

## Step 6: Modify Existing Files

### 6.1 Add API function — `src/features/{feature}/api/{feature}.api.ts`

For data-display:
```typescript
export async function fetch{Screen}Data(/* params */): Promise<ResponseType> {
  const response = await apiClient.get<ResponseType>('/{feature}/{endpoint}')
  return response.data
}
```

For form:
```typescript
export async function submit{Screen}(data: {Screen}FormData): Promise<ResponseType> {
  const response = await apiClient.post<ResponseType>('/{feature}/{endpoint}', data)
  return response.data
}
```

### 6.2 Add types — `src/features/{feature}/types/{feature}.types.ts`

Add interfaces for the screen's data shapes.

### 6.3 Add barrel export — `src/features/{feature}/index.ts`

```typescript
export { {Screen}Page } from './pages/{Screen}Page'
```

### 6.4 Add translation keys

**English** — add to `src/locales/en/{feature}.json`:
```json
{
  "{screen}": {
    "pageTitle": "{Screen Title}"
  }
}
```

For form pages, also add:
```json
{
  "{screen}": {
    "pageTitle": "{Screen Title}",
    "submit": "Submit",
    "submitting": "Submitting..."
  },
  "toast": {
    "{screen}Success": "Saved successfully",
    "{screen}Error": "Something went wrong. Please try again."
  },
  "validation": {
    // field-specific validation messages
  }
}
```

**Hebrew** — mirror structure with TODO placeholders.

### 6.5 Add route — `src/app/router.tsx`

Import the page and add route inside `ProtectedRoute > AppLayout > children`:

```typescript
import { {Screen}Page } from '@/features/{feature}'

// Add to AppLayout children:
{
  path: '/{route-path}',
  element: <{Screen}Page />,
},
```

### 6.6 Add nav entry (if requested) — `src/components/layout/AppLayout.tsx`

Read the file first. Add to `baseNavItems` array (or admin-only section if appropriate):

```typescript
{ label: t('nav.{feature}'), path: '/{feature}', icon: SomeIcon },
```

Also add the icon import from `lucide-react` and ensure the nav label exists in `common.json` translation files.

## Conventions Enforced

- All user-facing text via `useTranslation` — zero hardcoded strings
- RTL: logical CSS properties only (`ps-`/`pe-`/`start-`/`end-`)
- Path alias `@/` for all imports
- Feature public API via `index.ts` only
- Query keys: `[featureName, operation, ...params]`
- Schemas use factory functions accepting `t` for translated validation
- `useMemo(() => createSchema(t), [i18n.language])` for reactive schema updates
- `zodResolver` for React Hook Form integration
- Mutations always invalidate related queries
- Error handling: Axios error check with server message fallback
- `function` declarations, `interface` for props
