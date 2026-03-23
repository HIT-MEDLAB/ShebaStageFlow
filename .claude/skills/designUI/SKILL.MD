---
name: designUI
description: "Decomposes a screen into reusable dumb components before any code is written. Use when: 'build the assignments screen', 'design the constraints UI', 'break down this screen', 'plan the settings page', 'decompose the schedule view', 'what components do I need for X screen'. Must run BEFORE createScreen or createComponent."
user_invocable: true
---

# Design UI Skill

You are designing the component architecture for a screen in the Shiba app. Your job is to decompose the UI into reusable dumb components, map Shadcn primitives, draft props interfaces, and produce a design document for approval. You do **NOT** write any code — you output a plan that the user then scaffolds via the existing skills (`createFeature`, `createComponent`, `createScreen`, `createHook`).

---

## Step 1: Understand the UI

Gather the following (skip if already provided):
1. **Screen name** (PascalCase, e.g., `AssignmentBoard`)
2. **Feature name** (kebab-case, e.g., `assignments`)
3. **User role scope** — which roles see this screen? Does the view differ by role (Admin vs Academic Coordinator)?
4. **Description or mockup** — what does this screen do? What data does it show? What actions can the user take?

Cross-reference with the PRD if available. Read `docs/PRD.md` (or the relevant section) to understand the screen's requirements, data, and role-based behavior.

---

## Step 2: Identify Visual Sections

Break the screen into logical visual areas. Example:

```
┌─────────────────────────────────────────┐
│  Page Header (title, description)       │
├─────────────────────────────────────────┤
│  Toolbar (filters, actions)             │
├─────────────────────────────────────────┤
│  Data Grid / Main Content               │
├─────────────────────────────────────────┤
│  Dialog (edit/create form)              │
└─────────────────────────────────────────┘
```

Name each section clearly. This becomes the component tree root level.

---

## Step 3: Decompose into Components

For each section, determine:
- Is it a single component or does it break into sub-components?
- What is its classification?
- Does it already exist in the project? (Check `src/components/shared/` and `src/features/*/components/`)

### Classification Rules

| Pattern | Classification | Example |
|---------|---------------|---------|
| Displays data from props, no state | **Pure props** | `StatsCard` |
| Has own i18n keys (table headers, column labels) | **Props + i18n** | `UniversityTable` |
| Controlled input (value + onChange) | **Controlled** | `WeekSelector` |
| Triggers actions via callback props | **Callback** | Delete button row |
| Contains form with validation | **NOT a component** — page/screen concern | Login form |
| Fetches data | **NOT a component** — hook/page concern | — |

If something contains form validation or fetches data, it belongs in the page orchestrator or a hook, not in a dumb component.

---

## Step 4: Decide Placement

For each component, decide where it lives:

- **Shared** (`src/components/shared/`) — reusable across 2+ features
  - Examples: `PageHeader`, `EmptyState`, `ConfirmDialog`, `StatusBadge`
  - Heuristic: "Would another feature ever render this exact component?"

- **Feature-scoped** (`src/features/{feature}/components/`) — domain-specific
  - Examples: `AssignmentCell`, `ConstraintRow`, `ScheduleSlot`
  - Heuristic: "This component only makes sense within this feature's domain"

---

## Step 5: Map Shadcn Primitives

Map each component to its Shadcn building blocks.

**Already installed:** Button, Card, Select, Table, Toggle, ToggleGroup

**May need installation** (flag these): Dialog, Input, Tabs, Badge, Checkbox, DropdownMenu, Tooltip, Sheet, Popover, Command, Calendar, Label, Separator, ScrollArea, Skeleton, Switch, Textarea, RadioGroup

For each component, list the Shadcn primitives it will use. If any are not yet installed, add them to a "Prerequisites" section.

---

## Step 6: Define Props Interfaces

Draft the `interface {Component}Props` for each component. Follow these rules:

- Always use `interface`, never `type`
- Use `LucideIcon` for icon props: `icon: LucideIcon`
- Callbacks as `onX: (param: Type) => void`
- Display text as pre-translated `string` (the page passes `t('key')`, not the component)
- Exception: components with own i18n keys (table headers) use `useTranslation` internally

Example:

```typescript
interface StatsCardProps {
  title: string          // pre-translated
  value: number
  icon: LucideIcon
}

interface AssignmentTableProps {
  assignments: Assignment[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

---

## Step 7: Plan the Page Orchestrator

Determine what the page component (`{Screen}Page.tsx`) needs:

1. **Hooks** — which query hooks, mutation hooks, utility hooks?
2. **Local state** — filters, selections, dialog open/close, current week/tab
3. **Role checks** — does it use `useIsAdmin()`? What renders differently per role?
4. **Data transformations** — any filtering, sorting, or mapping before passing to components?
5. **i18n namespace** — which feature namespace for `useTranslation`?

---

## Step 8: Present Design Document

Output the complete design document in this exact structure:

### 8.1 Component Tree (ASCII)

```
{Screen}Page
├── PageHeader (shared, pure props)
├── Toolbar
│   ├── WeekSelector (shared, controlled) [EXISTING]
│   └── FilterDropdown (feature, controlled)
├── AssignmentTable (feature, props+i18n)
│   └── AssignmentRow (feature, callback)
└── EditDialog (feature, callback)
```

Mark existing components with `[EXISTING]`.

### 8.2 File Plan

```
Components to CREATE:
  src/components/shared/PageHeader.tsx          — pure props
  src/features/{feature}/components/X.tsx       — props+i18n
  src/features/{feature}/components/Y.tsx       — controlled

Existing components to REUSE:
  src/components/shared/WeekSelector.tsx        — no changes needed

Shadcn primitives to INSTALL:
  npx shadcn@latest add dialog input badge      — needed by EditDialog, FilterDropdown
```

### 8.3 Props Interfaces

Present each interface in a code block:

```typescript
interface PageHeaderProps {
  title: string
  description?: string
}

interface AssignmentTableProps {
  assignments: Assignment[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}
```

### 8.4 Page Data Flow

```
{Screen}Page
  ├── useTranslation('{feature}')
  ├── use{Screen}Data()          → { data, isLoading }
  ├── useIsAdmin()               → isAdmin
  ├── useState: selectedWeek
  ├── useState: editDialogOpen
  │
  ├── renders PageHeader         ← title={t('...')}, description={t('...')}
  ├── renders Toolbar             ← week={selectedWeek}, onWeekChange={...}
  ├── renders DataTable           ← rows={data.items}, onEdit={...}
  └── renders EditDialog          ← open={editDialogOpen}, onClose={...}
```

### 8.5 Role-Based Rendering

| Element | Admin | Academic Coordinator |
|---------|-------|---------------------|
| Edit button | Visible | Hidden |
| Delete action | Visible | Hidden |
| Data scope | All universities | Own university only |

### 8.6 Types Needed

List any new TypeScript interfaces/types that will need to be added to `{feature}.types.ts`.

---

## Step 9: Wait for Approval, Then Direct to Scaffolding Skills

After presenting the design document, **wait for explicit user approval**.

Once approved, present the recommended skill invocation order:

```
Recommended scaffolding order:
1. /createFeature    — bootstrap {feature} (if not exists)
2. /createComponent  — PageHeader (shared)
3. /createComponent  — AssignmentTable (feature-scoped)
4. /createComponent  — EditDialog (feature-scoped)
5. /createScreen     — {Screen}Page (data-display mode)
6. /createHook       — use{Screen}Data (query hook)
```

Do **NOT** invoke these skills automatically. Present the list and let the user decide the order.

---

## Rules (non-negotiable)

1. **No code output** — this skill produces a design document, not implementation code
2. **Every component must be classifiable** — if you can't classify it, it's not a dumb component
3. **Props interfaces must be concrete** — no `any`, no `Record<string, unknown>`, no vague types
4. **RTL awareness** — note any components that will need special RTL handling (tables, directional icons)
5. **i18n awareness** — identify which components own their own i18n keys vs receive pre-translated strings
6. **Role-based section is mandatory** — even if both roles see the same thing, state that explicitly
