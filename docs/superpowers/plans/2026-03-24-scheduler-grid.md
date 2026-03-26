# Scheduler Grid View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the central scheduling grid screen for managing clinical rotation assignments — departments × weeks grid with drag-and-drop, constraint validation, dialogs for CRUD, and Excel import.

**Architecture:** Feature-Sliced Design under `features/scheduler/`. CSS Grid with sticky headers for the grid layout. @dnd-kit/core for drag-and-drop. TanStack React Query for server state, Zustand for UI state. Hybrid client+server constraint validation.

**Tech Stack:** React 19, TypeScript, @dnd-kit/core, TailwindCSS v4, Radix Dialog, React Hook Form + Zod, xlsx (SheetJS), react-day-picker, date-fns, Sonner toasts, Express + Prisma (backend)

**Spec:** `docs/superpowers/specs/2026-03-24-scheduler-grid-design.md`

---

## File Map

### New Files — Frontend (`client/src/`)

| File | Responsibility |
|------|---------------|
| `features/scheduler/pages/SchedulerPage.tsx` | Page component (route entry), orchestrates layout |
| `features/scheduler/components/SchedulerToolbar.tsx` | Top action bar (Manual Assignment + Import buttons + AcademicYear selector) |
| `features/scheduler/components/SchedulerFilters.tsx` | Filter dropdowns (university, shift, year) |
| `features/scheduler/components/AssignmentLegend.tsx` | Color key for card types/statuses |
| `features/scheduler/components/grid/SchedulerGrid.tsx` | CSS Grid container, scroll wrapper |
| `features/scheduler/components/grid/GridHeader.tsx` | Sticky top row with week column headers |
| `features/scheduler/components/grid/GridRow.tsx` | Single department row with cells |
| `features/scheduler/components/grid/GridCell.tsx` | Droppable zone (dept × week), renders cards + blocked overlay |
| `features/scheduler/components/grid/AssignmentCard.tsx` | Draggable card with university, year, type, shift, count |
| `features/scheduler/components/grid/BlockedOverlay.tsx` | Visual overlay for blocked cells |
| `features/scheduler/components/grid/GridDragOverlay.tsx` | Ghost card following cursor during drag |
| `features/scheduler/components/dialogs/ManualAssignmentDialog.tsx` | Create assignment form dialog |
| `features/scheduler/components/dialogs/ExcelImportDialog.tsx` | Assignment Excel import dialog |
| `features/scheduler/components/dialogs/EditAssignmentDialog.tsx` | Edit assignment + student list dialog |
| `features/scheduler/components/dialogs/StudentListSection.tsx` | Student table with add/import/delete |
| `features/scheduler/components/dialogs/ExcelDropZone.tsx` | Reusable drag-and-drop file upload zone |
| `features/scheduler/hooks/useAssignments.ts` | React Query: fetch assignments by academic year |
| `features/scheduler/hooks/useDepartments.ts` | React Query: fetch department list |
| `features/scheduler/hooks/useUniversities.ts` | React Query: fetch university list |
| `features/scheduler/hooks/useConstraints.ts` | React Query: fetch constraints + holidays |
| `features/scheduler/hooks/useAcademicYears.ts` | React Query: fetch academic years list |
| `features/scheduler/hooks/useAcademicYearWeeks.ts` | Derived: compute week definitions from year dates |
| `features/scheduler/hooks/useMoveAssignment.ts` | Mutation: drag-and-drop move with optimistic update |
| `features/scheduler/hooks/useCreateAssignment.ts` | Mutation: create via manual dialog |
| `features/scheduler/hooks/useUpdateAssignment.ts` | Mutation: update via edit dialog |
| `features/scheduler/hooks/useDeleteAssignment.ts` | Mutation: delete assignment |
| `features/scheduler/hooks/useImportAssignments.ts` | Mutation: bulk import from Excel |
| `features/scheduler/hooks/useGridData.ts` | Derived: assignments + filters → 2D grid map |
| `features/scheduler/hooks/useBlockedCells.ts` | Derived: constraints + holidays → blocked cell map |
| `features/scheduler/api/scheduler.api.ts` | All API functions (axios calls) |
| `features/scheduler/types/scheduler.types.ts` | TypeScript interfaces |
| `features/scheduler/schemas/assignmentSchema.ts` | Zod schema for assignment form |
| `features/scheduler/schemas/studentSchema.ts` | Zod schema for student form |
| `features/scheduler/validators/assignmentValidator.ts` | Client-side drop validation engine |
| `features/scheduler/stores/schedulerStore.ts` | Zustand store for UI state |
| `features/scheduler/index.ts` | Public exports |
| `locales/en/scheduler.json` | English translations |
| `locales/he/scheduler.json` | Hebrew translations |

### New Files — Backend (`server/src/`)

| File | Responsibility |
|------|---------------|
| `modules/academic-year/academic-year.routes.ts` | AcademicYear CRUD routes |
| `modules/academic-year/academic-year.service.ts` | AcademicYear business logic |
| `modules/academic-year/academic-year.repository.ts` | AcademicYear Prisma queries |
| `modules/academic-year/academic-year.schema.ts` | Zod validation schemas |
| `modules/department/department.routes.ts` | Department list routes |
| `modules/department/department.service.ts` | Department business logic |
| `modules/department/department.repository.ts` | Department Prisma queries |
| `modules/assignment/assignment.routes.ts` | Assignment CRUD + move + import routes |
| `modules/assignment/assignment.service.ts` | Assignment business logic + validation |
| `modules/assignment/assignment.repository.ts` | Assignment Prisma queries |
| `modules/assignment/assignment.schema.ts` | Zod validation schemas |
| `modules/constraint/constraint.routes.ts` | Constraints + holidays fetch routes |
| `modules/constraint/constraint.service.ts` | Constraint business logic |
| `modules/constraint/constraint.repository.ts` | Constraint Prisma queries |

### Modified Files

| File | Change |
|------|--------|
| `server/prisma/schema.prisma` | Add `AcademicYear` model, add `academicYearId` FK to `Assignment` |
| `client/src/app/router.tsx` | Add `/scheduler` route |
| `client/src/components/layout/Sidebar.tsx` | Add scheduler nav link |
| `client/src/lib/i18n.ts` | Add `scheduler` namespace |
| `server/src/app.ts` | Register new route modules |

---

## Task 1: Install Dependencies + Foundation

**Files:**
- Modify: `client/package.json` (install frontend deps)
- Create: `client/src/features/scheduler/types/scheduler.types.ts`
- Create: `client/src/features/scheduler/stores/schedulerStore.ts`
- Create: `client/src/features/scheduler/index.ts`
- Modify: `client/src/lib/i18n.ts`
- Create: `client/src/locales/en/scheduler.json`
- Create: `client/src/locales/he/scheduler.json`

- [ ] **Step 1: Install frontend dependencies**

```bash
cd /Users/klutz/Desktop/shiba/client && npm install @dnd-kit/core @dnd-kit/utilities react-day-picker xlsx date-fns
```

- [ ] **Step 2: Create TypeScript types**

Create `client/src/features/scheduler/types/scheduler.types.ts` with all shared interfaces:
- `Assignment` (id, departmentId, universityId, startDate, endDate, type, shiftType, status, studentCount, yearInProgram, tutorName, university name, department name)
- `Department` (id, name, hasMorningShift, hasEveningShift)
- `AcademicYear` (id, name, startDate, endDate)
- `WeekDefinition` (weekNumber, startDate, endDate)
- `BlockReason` (type: 'holiday' | 'dateBlock' | 'capacityFull', description, constraintName?)
- `DepartmentConstraint` (id, departmentId, morningCapacity, eveningCapacity, electiveCapacity, blockedStartDate?, blockedEndDate?)
- `IronConstraint` (id, name, description, isActive)
- `Holiday` (id, name, date, year)
- `Student` (id, firstName, lastName, nationalId, phone, email)
- `SchedulerFilters` (selectedUniversities, selectedShift, selectedYear)

All IDs are `number` type matching Prisma `Int`.

- [ ] **Step 3: Create Zustand store**

Create `client/src/features/scheduler/stores/schedulerStore.ts`:

```typescript
import { create } from 'zustand'

interface SchedulerStore {
  academicYearId: number | null
  selectedUniversities: number[]
  selectedShift: 'all' | 'morning' | 'evening'
  selectedYear: number | null
  activeDialog: null | 'create' | 'import' | 'edit'
  editingAssignmentId: number | null
  activeDragId: number | null

  setAcademicYear: (yearId: number) => void
  setUniversityFilter: (ids: number[]) => void
  setShiftFilter: (shift: 'all' | 'morning' | 'evening') => void
  setYearFilter: (year: number | null) => void
  openDialog: (type: 'create' | 'import' | 'edit', assignmentId?: number) => void
  closeDialog: () => void
  setActiveDragId: (id: number | null) => void
}

export const useSchedulerStore = create<SchedulerStore>((set) => ({
  academicYearId: null,
  selectedUniversities: [],
  selectedShift: 'all',
  selectedYear: null,
  activeDialog: null,
  editingAssignmentId: null,
  activeDragId: null,

  setAcademicYear: (yearId) => set({ academicYearId: yearId }),
  setUniversityFilter: (ids) => set({ selectedUniversities: ids }),
  setShiftFilter: (shift) => set({ selectedShift: shift }),
  setYearFilter: (year) => set({ selectedYear: year }),
  openDialog: (type, assignmentId) =>
    set({ activeDialog: type, editingAssignmentId: assignmentId ?? null }),
  closeDialog: () => set({ activeDialog: null, editingAssignmentId: null }),
  setActiveDragId: (id) => set({ activeDragId: id }),
}))
```

- [ ] **Step 4: Setup i18n namespace**

Add `'scheduler'` to the `ns` array in `client/src/lib/i18n.ts`.

Create minimal `client/src/locales/en/scheduler.json` and `client/src/locales/he/scheduler.json` with initial keys:
```json
{
  "title": "Scheduler" / "לוח שיבוצים",
  "toolbar": { "manualAssignment": "...", "importExcel": "..." },
  "filters": { "university": "...", "shift": "...", "year": "...", "allShifts": "...", "morning": "...", "evening": "..." },
  "grid": { "departments": "...", "week": "...", "blocked": { "holiday": "...", "dateBlock": "...", "capacityFull": "..." } },
  "card": { "group": "...", "elective": "...", "noStudents": "-" },
  "status": { "approved": "...", "pending": "...", "rejected": "..." },
  "dialogs": { ... }
}
```

Both en and he files. All user-facing text must come from these files — never hardcoded.

- [ ] **Step 5: Create feature index**

Create `client/src/features/scheduler/index.ts` exporting the page component (lazy).

- [ ] **Step 6: Register route**

In `client/src/app/router.tsx`, add a protected route for `/scheduler` pointing to `SchedulerPage`.
In `client/src/components/layout/Sidebar.tsx`, add a navigation link with Calendar icon from Lucide.

- [ ] **Step 7: Commit**

```bash
git add client/src/features/scheduler/ client/src/locales/ client/src/lib/i18n.ts client/src/app/router.tsx client/src/components/layout/Sidebar.tsx client/package.json client/package-lock.json
git commit -m "feat(scheduler): install dependencies and setup foundation (types, store, i18n, routing)"
```

---

## Task 2: Backend — AcademicYear Model + Migration

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/src/modules/academic-year/academic-year.routes.ts`
- Create: `server/src/modules/academic-year/academic-year.service.ts`
- Create: `server/src/modules/academic-year/academic-year.repository.ts`
- Create: `server/src/modules/academic-year/academic-year.schema.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Add AcademicYear model to Prisma schema**

Add to `server/prisma/schema.prisma`:

```prisma
model AcademicYear {
  id          Int          @id @default(autoincrement())
  name        String       @unique
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  assignments Assignment[]
}
```

Also add `academicYearId Int` and `academicYear AcademicYear @relation(fields: [academicYearId], references: [id])` to the existing `Assignment` model.

- [ ] **Step 2: Run Prisma migration**

```bash
cd /Users/klutz/Desktop/shiba/server && npx prisma migrate dev --name add-academic-year
```

- [ ] **Step 3: Create AcademicYear module**

Follow the pattern from `server/src/modules/university/`:
- `academic-year.schema.ts`: Zod schemas for create/update (name, startDate, endDate)
- `academic-year.repository.ts`: Prisma CRUD (findAll, findById, create, update, delete)
- `academic-year.service.ts`: Thin service layer calling repository
- `academic-year.routes.ts`: Express router with `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`

All routes require authentication middleware.

- [ ] **Step 4: Register routes in app.ts**

Add `import academicYearRoutes from './modules/academic-year/academic-year.routes'` and `app.use('/api/academic-years', academicYearRoutes)` in `server/src/app.ts`.

- [ ] **Step 5: Seed an academic year**

Add to `server/prisma/seed.ts`:
```typescript
await prisma.academicYear.create({
  data: { name: '2025-2026', startDate: new Date('2025-10-01'), endDate: new Date('2026-06-30') }
})
```

- [ ] **Step 6: Run seed and verify**

```bash
cd /Users/klutz/Desktop/shiba/server && npx prisma db seed
```

Start the server and test: `curl http://localhost:3001/api/academic-years` (with auth cookie).

- [ ] **Step 7: Commit**

```bash
git add server/prisma/ server/src/modules/academic-year/ server/src/app.ts
git commit -m "feat(backend): add AcademicYear model, migration, and CRUD API"
```

---

## Task 3: Backend — Department API

**Files:**
- Create: `server/src/modules/department/department.routes.ts`
- Create: `server/src/modules/department/department.service.ts`
- Create: `server/src/modules/department/department.repository.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create Department module**

- `department.repository.ts`: `findAll()` returns all departments with their constraints. Include `departmentConstraints` relation in query.
- `department.service.ts`: Calls repository, returns departments.
- `department.routes.ts`: `GET /` — list all departments (authenticated).

- [ ] **Step 2: Register in app.ts**

Add `app.use('/api/departments', departmentRoutes)`.

- [ ] **Step 3: Seed departments if not already present**

Check if seed.ts already creates departments. If not, add seeding for ~10 departments (רפואה פנימית, ילדים, כירורגיה, etc.).

- [ ] **Step 4: Verify**

```bash
curl http://localhost:3001/api/departments
```

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/department/ server/src/app.ts server/prisma/seed.ts
git commit -m "feat(backend): add Department list API endpoint"
```

---

## Task 4: Backend — Assignment CRUD + Move + Import

**Files:**
- Create: `server/src/modules/assignment/assignment.routes.ts`
- Create: `server/src/modules/assignment/assignment.service.ts`
- Create: `server/src/modules/assignment/assignment.repository.ts`
- Create: `server/src/modules/assignment/assignment.schema.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create Zod validation schemas**

`assignment.schema.ts`:
- `createAssignmentSchema`: departmentId, universityId, academicYearId, startDate (must be Sunday), endDate (must be Thursday, after start), type (GROUP/ELECTIVE), shiftType (MORNING/EVENING), studentCount (optional positive int), yearInProgram, tutorName (optional)
- `updateAssignmentSchema`: same fields, all optional
- `moveAssignmentSchema`: departmentId, weekStartDate (the new target week's Sunday)
- `importAssignmentsSchema`: array of createAssignmentSchema

Validate Sunday/Thursday day-of-week in the schemas.

- [ ] **Step 2: Create repository**

`assignment.repository.ts`:
- `findByAcademicYear(academicYearId, filters?)`: Returns assignments with university and department relations. Supports filters: universityId[], shiftType, yearInProgram.
- `findById(id)`: Single assignment with students relation.
- `create(data)`: Create new assignment.
- `update(id, data)`: Update assignment fields.
- `move(id, departmentId, startDate, endDate)`: Update department and dates.
- `delete(id)`: Delete assignment.
- `bulkCreate(data[])`: Create multiple assignments (for import).

- [ ] **Step 3: Create service with validation**

`assignment.service.ts`:
- Server-side constraint validation on create/move:
  - Check department date blocks (DepartmentConstraint.blockedStartDate/blockedEndDate)
  - Check holiday conflicts
  - Check capacity limits
  - Check iron constraints (active ones)
- If coordinator creates a conflicting assignment → set status PENDING
- If admin creates → set status APPROVED (or PENDING if conflicts exist that need review)

- [ ] **Step 4: Create routes**

`assignment.routes.ts`:
- `GET /` — list by academicYear with filters (query params)
- `GET /:id` — single assignment with students
- `POST /` — create (validateRequest middleware)
- `PATCH /:id` — update
- `PATCH /:id/move` — move to new dept/week
- `DELETE /:id` — delete
- `POST /import` — bulk import
- `POST /:id/students` — add student (body: firstName, lastName, nationalId, phone, email)
- `DELETE /:id/students/:studentId` — remove student
- `POST /:id/students/import` — bulk import students

All routes require authentication.

- [ ] **Step 5: Register in app.ts**

Add `app.use('/api/assignments', assignmentRoutes)`.

- [ ] **Step 6: Test with curl**

Create an assignment, move it, fetch by academic year. Verify constraint validation rejects invalid moves.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/assignment/ server/src/app.ts
git commit -m "feat(backend): add Assignment CRUD, move, import, and student management APIs"
```

---

## Task 5: Backend — Constraints + Holidays API

**Files:**
- Create: `server/src/modules/constraint/constraint.routes.ts`
- Create: `server/src/modules/constraint/constraint.service.ts`
- Create: `server/src/modules/constraint/constraint.repository.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create repository**

`constraint.repository.ts`:
- `findDepartmentConstraints()`: All DepartmentConstraint records with department relation.
- `findIronConstraints(activeOnly: boolean)`: IronConstraint records.
- `findHolidays(year: number)`: Holidays for a given year.

- [ ] **Step 2: Create service**

`constraint.service.ts`:
- `getConstraintsForYear(academicYear)`: Returns `{ departmentConstraints, ironConstraints, holidays }`.

- [ ] **Step 3: Create routes**

`constraint.routes.ts`:
- `GET /` — returns all constraints + holidays for given academic year (query param). Single endpoint that returns the full constraint picture.

- [ ] **Step 4: Register + seed constraints**

Register `app.use('/api/constraints', constraintRoutes)`.
Add sample constraints and holidays to seed.ts.

- [ ] **Step 5: Verify and commit**

```bash
curl http://localhost:3001/api/constraints?academicYearId=1
git add server/src/modules/constraint/ server/src/app.ts server/prisma/seed.ts
git commit -m "feat(backend): add Constraints and Holidays API endpoint"
```

---

## Task 6: Frontend — API Layer + Query Hooks

**Files:**
- Create: `client/src/features/scheduler/api/scheduler.api.ts`
- Create: `client/src/features/scheduler/hooks/useAssignments.ts`
- Create: `client/src/features/scheduler/hooks/useDepartments.ts`
- Create: `client/src/features/scheduler/hooks/useUniversities.ts`
- Create: `client/src/features/scheduler/hooks/useConstraints.ts`
- Create: `client/src/features/scheduler/hooks/useAcademicYears.ts`
- Create: `client/src/features/scheduler/hooks/useAcademicYearWeeks.ts`

- [ ] **Step 1: Create API functions**

`scheduler.api.ts` — all axios calls following the pattern from `features/home/api/home.api.ts`:

```typescript
import apiClient from '@/lib/apiClient'
import type { Assignment, Department, AcademicYear, ... } from '../types/scheduler.types'

export async function fetchAssignments(academicYearId: number, filters?: SchedulerFilters) {
  const { data } = await apiClient.get<Assignment[]>('/assignments', {
    params: { academicYearId, ...filters }
  })
  return data
}

export async function fetchDepartments() { ... }
export async function fetchUniversities() { ... } // reuse existing endpoint
export async function fetchConstraints(academicYearId: number) { ... }
export async function fetchAcademicYears() { ... }
export async function createAssignment(data: CreateAssignmentDto) { ... }
export async function updateAssignment(id: number, data: UpdateAssignmentDto) { ... }
export async function moveAssignment(id: number, data: MoveAssignmentDto) { ... }
export async function deleteAssignment(id: number) { ... }
export async function importAssignments(data: CreateAssignmentDto[]) { ... }
export async function addStudent(assignmentId: number, data: CreateStudentDto) { ... }
export async function removeStudent(assignmentId: number, studentId: number) { ... }
export async function importStudents(assignmentId: number, data: CreateStudentDto[]) { ... }
```

- [ ] **Step 2: Create query hooks**

Each hook follows the pattern from `features/home/hooks/useHomeStats.ts`:

```typescript
// useAssignments.ts
export function useAssignments(academicYearId: number | null, filters: SchedulerFilters) {
  return useQuery({
    queryKey: ['scheduler', 'assignments', academicYearId, filters],
    queryFn: () => fetchAssignments(academicYearId!, filters),
    enabled: !!academicYearId,
  })
}
```

Similarly for `useDepartments`, `useUniversities`, `useConstraints`, `useAcademicYears`.

- [ ] **Step 3: Create useAcademicYearWeeks hook**

This is a derived hook that computes week definitions from an academic year's date range using `date-fns`:

```typescript
import { useMemo } from 'react'
import { eachWeekOfInterval, addDays, startOfWeek } from 'date-fns'
import type { AcademicYear, WeekDefinition } from '../types/scheduler.types'

export function useAcademicYearWeeks(academicYear: AcademicYear | undefined): WeekDefinition[] {
  return useMemo(() => {
    if (!academicYear) return []
    const sundays = eachWeekOfInterval(
      { start: new Date(academicYear.startDate), end: new Date(academicYear.endDate) },
      { weekStartsOn: 0 } // Sunday
    )
    return sundays.map((sunday, index) => ({
      weekNumber: index + 1,
      startDate: sunday, // Sunday
      endDate: addDays(sunday, 4), // Thursday
    }))
  }, [academicYear])
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/features/scheduler/api/ client/src/features/scheduler/hooks/
git commit -m "feat(scheduler): add API layer and React Query hooks"
```

---

## Task 7: Frontend — Derived Hooks + Validation Engine

**Files:**
- Create: `client/src/features/scheduler/hooks/useGridData.ts`
- Create: `client/src/features/scheduler/hooks/useBlockedCells.ts`
- Create: `client/src/features/scheduler/validators/assignmentValidator.ts`

- [ ] **Step 1: Create useGridData hook**

Combines assignments + store filters into a 2D map for grid rendering:

```typescript
export function useGridData(
  assignments: Assignment[] | undefined,
  filters: { selectedUniversities: number[]; selectedShift: string; selectedYear: number | null }
): Map<number, Map<number, Assignment[]>> {
  return useMemo(() => {
    const grid = new Map<number, Map<number, Assignment[]>>()
    if (!assignments) return grid

    const filtered = assignments.filter((a) => {
      if (filters.selectedUniversities.length && !filters.selectedUniversities.includes(a.universityId)) return false
      if (filters.selectedShift !== 'all' && a.shiftType.toLowerCase() !== filters.selectedShift) return false
      if (filters.selectedYear && a.yearInProgram !== filters.selectedYear) return false
      return true
    })

    for (const assignment of filtered) {
      // Map assignment to its weekNumber based on startDate
      const weekNum = computeWeekNumber(assignment.startDate, academicYearStart)
      if (!grid.has(assignment.departmentId)) grid.set(assignment.departmentId, new Map())
      const deptMap = grid.get(assignment.departmentId)!
      if (!deptMap.has(weekNum)) deptMap.set(weekNum, [])
      deptMap.get(weekNum)!.push(assignment)
    }
    return grid
  }, [assignments, filters])
}
```

- [ ] **Step 2: Create useBlockedCells hook**

Computes blocked cell map from constraints + holidays:

```typescript
export function useBlockedCells(
  constraints: { departmentConstraints: DepartmentConstraint[]; holidays: Holiday[] } | undefined,
  weeks: WeekDefinition[],
  assignments: Assignment[] | undefined
): Map<string, BlockReason> {
  return useMemo(() => {
    const blocked = new Map<string, BlockReason>()
    if (!constraints || !weeks.length) return blocked

    // Holiday blocking: if any holiday date falls within a week's Sun-Thu range, block ALL departments for that week
    for (const week of weeks) {
      for (const holiday of constraints.holidays) {
        const holidayDate = new Date(holiday.date)
        if (holidayDate >= week.startDate && holidayDate <= week.endDate) {
          // Block all departments for this week
          // Key format: "dept:{deptId}:week:{weekNum}"
          // For holidays, use a special "all" key, or iterate departments
          // Store as "holiday:week:{weekNum}" and check in validator
        }
      }
    }

    // Department date blocks
    for (const dc of constraints.departmentConstraints) {
      if (dc.blockedStartDate && dc.blockedEndDate) {
        for (const week of weeks) {
          if (weeksOverlap(week, dc.blockedStartDate, dc.blockedEndDate)) {
            blocked.set(`dept:${dc.departmentId}:week:${week.weekNumber}`, {
              type: 'dateBlock',
              description: 'Department blocked on these dates',
            })
          }
        }
      }
    }

    return blocked
  }, [constraints, weeks, assignments])
}
```

- [ ] **Step 3: Create assignment validator**

`validators/assignmentValidator.ts`:

```typescript
import type { Assignment, BlockReason, IronConstraint } from '../types/scheduler.types'

export type ValidationResult =
  | { valid: true }
  | { valid: false; reasonKey: string; reasonParams?: Record<string, string> }

export function validateDrop(
  assignment: Assignment,
  targetDeptId: number,
  targetWeekNum: number,
  context: {
    blockedCells: Map<string, BlockReason>
    existingAssignments: Assignment[]
    ironConstraints: IronConstraint[]
    departmentConstraints: DepartmentConstraint[]
  }
): ValidationResult {
  const cellKey = `dept:${targetDeptId}:week:${targetWeekNum}`

  // 1. Check full blocks (holiday, date block)
  if (context.blockedCells.has(cellKey)) {
    const reason = context.blockedCells.get(cellKey)!
    return { valid: false, reasonKey: `grid.blocked.${reason.type}`, reasonParams: { name: reason.description } }
  }

  // 2. Check holiday blocks (week-level)
  const holidayKey = `holiday:week:${targetWeekNum}`
  if (context.blockedCells.has(holidayKey)) {
    const reason = context.blockedCells.get(holidayKey)!
    return { valid: false, reasonKey: 'grid.blocked.holiday', reasonParams: { name: reason.description } }
  }

  // 3. Check capacity limits
  const cellAssignments = context.existingAssignments.filter(
    (a) => a.departmentId === targetDeptId && getWeekNumber(a) === targetWeekNum && a.id !== assignment.id
  )
  const deptConstraint = context.departmentConstraints.find((dc) => dc.departmentId === targetDeptId)
  if (deptConstraint) {
    const shiftCount = cellAssignments.filter((a) => a.shiftType === assignment.shiftType && a.type === 'GROUP').length
    const capacity = assignment.shiftType === 'MORNING' ? deptConstraint.morningCapacity : deptConstraint.eveningCapacity
    if (assignment.type === 'GROUP' && shiftCount >= capacity) {
      return { valid: false, reasonKey: 'grid.blocked.capacityFull' }
    }
  }

  // 4. Check iron constraints (dynamic from DB)
  for (const ic of context.ironConstraints) {
    if (!ic.isActive) continue
    // Map known constraint types to validation logic
    // The constraint name/description determines the rule
    // This is extensible as new iron constraints are added to DB
  }

  return { valid: true }
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/features/scheduler/hooks/useGridData.ts client/src/features/scheduler/hooks/useBlockedCells.ts client/src/features/scheduler/validators/
git commit -m "feat(scheduler): add derived hooks (gridData, blockedCells) and validation engine"
```

---

## Task 8: Frontend — Zod Schemas

**Files:**
- Create: `client/src/features/scheduler/schemas/assignmentSchema.ts`
- Create: `client/src/features/scheduler/schemas/studentSchema.ts`

- [ ] **Step 1: Create assignment form schema**

```typescript
import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createAssignmentSchema(t: TFunction) {
  return z.object({
    departmentId: z.number({ required_error: t('scheduler:dialogs.validation.departmentRequired') }),
    startDate: z.date({ required_error: t('scheduler:dialogs.validation.startDateRequired') })
      .refine((d) => d.getDay() === 0, { message: t('scheduler:dialogs.validation.mustBeSunday') }),
    endDate: z.date({ required_error: t('scheduler:dialogs.validation.endDateRequired') })
      .refine((d) => d.getDay() === 4, { message: t('scheduler:dialogs.validation.mustBeThursday') }),
    universityId: z.number({ required_error: t('scheduler:dialogs.validation.universityRequired') }),
    type: z.enum(['GROUP', 'ELECTIVE'], { required_error: t('scheduler:dialogs.validation.typeRequired') }),
    shiftType: z.enum(['MORNING', 'EVENING'], { required_error: t('scheduler:dialogs.validation.shiftRequired') }),
    studentCount: z.number().positive().optional(),
    yearInProgram: z.number({ required_error: t('scheduler:dialogs.validation.yearRequired') }).min(3).max(6),
    tutorName: z.string().optional(),
  }).refine((data) => data.endDate > data.startDate, {
    message: t('scheduler:dialogs.validation.endAfterStart'),
    path: ['endDate'],
  })
}
```

- [ ] **Step 2: Create student form schema**

```typescript
export function createStudentSchema(t: TFunction) {
  return z.object({
    firstName: z.string().min(1, t('scheduler:dialogs.validation.firstNameRequired')),
    lastName: z.string().min(1, t('scheduler:dialogs.validation.lastNameRequired')),
    nationalId: z.string().min(1, t('scheduler:dialogs.validation.nationalIdRequired')),
    phone: z.string().optional(),
    email: z.string().email(t('scheduler:dialogs.validation.emailInvalid')).optional().or(z.literal('')),
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/features/scheduler/schemas/
git commit -m "feat(scheduler): add Zod validation schemas for assignment and student forms"
```

---

## Task 9: Frontend — Grid Core Components

**Files:**
- Create: `client/src/features/scheduler/components/grid/AssignmentCard.tsx`
- Create: `client/src/features/scheduler/components/grid/BlockedOverlay.tsx`
- Create: `client/src/features/scheduler/components/grid/GridCell.tsx`
- Create: `client/src/features/scheduler/components/grid/GridHeader.tsx`
- Create: `client/src/features/scheduler/components/grid/GridRow.tsx`
- Create: `client/src/features/scheduler/components/grid/SchedulerGrid.tsx`
- Create: `client/src/features/scheduler/components/grid/GridDragOverlay.tsx`

- [ ] **Step 1: Create AssignmentCard**

Draggable card using `useDraggable` from @dnd-kit/core. Displays:
- University name (from assignment.universityName)
- Year in program badge
- Type badge (Group = primary color, Elective = accent color)
- Shift badge (Morning/Evening icon)
- Student count (or "-" if null/0)
- Status styling: APPROVED = solid, PENDING = dashed border + opacity 0.85, REJECTED = opacity 0.5 + line-through on name

Color-code by university (assign colors from a palette based on universityId).

Uses `useDraggable({ id: assignment.id, data: assignment })` from dnd-kit.

onClick → `store.openDialog('edit', assignment.id)`.

- [ ] **Step 2: Create BlockedOverlay**

Renders on top of blocked cells. Takes a `BlockReason` prop.
- `holiday`: gray bg, dashed border, calendar-off icon (Lucide), holiday name text
- `dateBlock`: light red bg, dashed border, lock icon, "Department blocked" text
- `capacityFull`: yellow border, alert-triangle icon, "Capacity full" text

Uses Radix Tooltip for hover explanation.

- [ ] **Step 3: Create GridCell**

Droppable zone using `useDroppable` from @dnd-kit/core with `id: \`cell-${departmentId}-${weekNumber}\``.

- Accepts `departmentId`, `weekNumber`, `assignments: Assignment[]`, `blockReason?: BlockReason`
- If blocked → render BlockedOverlay
- Otherwise → render AssignmentCard for each assignment
- During drag hover: highlight green (valid) or red (blocked) using `isOver` from useDroppable + validation result

- [ ] **Step 4: Create GridHeader**

Sticky top row. Renders:
- First cell: "מחלקות" / "Departments" label (sticky right for RTL)
- Week cells: "שבוע N" with formatted date range below (startDate - endDate)

Uses `position: sticky; top: 0; z-index: 10` for the header row.
Department column header also uses `position: sticky; inset-inline-end: 0; z-index: 20` (higher z-index since it's both sticky-top and sticky-right).

- [ ] **Step 5: Create GridRow**

Single department row:
- First cell: department name label (sticky right with `position: sticky; inset-inline-end: 0`)
- Then GridCell for each week

- [ ] **Step 6: Create SchedulerGrid**

The main CSS Grid container:

```tsx
<div className="overflow-auto max-h-[calc(100vh-250px)]" dir="rtl">
  <div
    className="grid gap-px bg-border"
    style={{
      gridTemplateColumns: `200px repeat(${weeks.length}, 160px)`,
    }}
  >
    <GridHeader weeks={weeks} />
    {departments.map((dept) => (
      <GridRow
        key={dept.id}
        department={dept}
        weeks={weeks}
        gridData={gridData}
        blockedCells={blockedCells}
      />
    ))}
  </div>
</div>
```

- [ ] **Step 7: Create GridDragOverlay**

Renders inside `<DragOverlay>` from dnd-kit. Shows a styled ghost copy of the AssignmentCard currently being dragged (using `activeDragId` from store to find the assignment data).

- [ ] **Step 8: Commit**

```bash
git add client/src/features/scheduler/components/grid/
git commit -m "feat(scheduler): add grid core components (Grid, Header, Row, Cell, Card, BlockedOverlay, DragOverlay)"
```

---

## Task 10: Frontend — SchedulerPage + Toolbar + Filters

**Files:**
- Create: `client/src/features/scheduler/pages/SchedulerPage.tsx`
- Create: `client/src/features/scheduler/components/SchedulerToolbar.tsx`
- Create: `client/src/features/scheduler/components/SchedulerFilters.tsx`
- Create: `client/src/features/scheduler/components/AssignmentLegend.tsx`

- [ ] **Step 1: Create SchedulerToolbar**

Contains:
- AcademicYear selector (dropdown from `useAcademicYears()`, sets store.academicYearId)
- "שיבוץ ידני" button → `store.openDialog('create')`
- "ייבוא מאקסל" button → `store.openDialog('import')`

Uses existing Button component from `components/ui/button`.

- [ ] **Step 2: Create SchedulerFilters**

Filter bar with:
- UniversityFilter: Multi-select dropdown populated from `useUniversities()`. Uses Radix Select or a Combobox pattern.
- ShiftFilter: ToggleGroup (Morning/Evening/All) using existing `components/ui/toggle-group`.
- YearFilter: Select dropdown (years 3-6).

All filters update `useSchedulerStore` actions.

- [ ] **Step 3: Create AssignmentLegend**

Color key showing:
- University color swatches
- Assignment type colors (Group = primary, Elective = accent)
- Status indicators (Approved = solid, Pending = dashed, Rejected = dimmed)

Simple flex layout with small colored circles/squares and labels.

- [ ] **Step 4: Create SchedulerPage**

Orchestrates everything:

```tsx
export default function SchedulerPage() {
  const { t } = useTranslation('scheduler')
  const { academicYearId } = useSchedulerStore()
  const { data: academicYears } = useAcademicYears()
  const currentYear = academicYears?.find((y) => y.id === academicYearId)
  const { data: departments } = useDepartments()
  const { data: assignments } = useAssignments(academicYearId, filters)
  const { data: constraints } = useConstraints(academicYearId)
  const weeks = useAcademicYearWeeks(currentYear)
  const gridData = useGridData(assignments, filters)
  const blockedCells = useBlockedCells(constraints, weeks, assignments)

  return (
    <div className="flex flex-col gap-4 p-4">
      <SchedulerToolbar />
      <SchedulerFilters />
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SchedulerGrid
          departments={departments ?? []}
          weeks={weeks}
          gridData={gridData}
          blockedCells={blockedCells}
        />
        <DragOverlay>
          {activeDragId ? <GridDragOverlay assignment={...} /> : null}
        </DragOverlay>
      </DndContext>
      {/* Dialogs rendered conditionally based on store.activeDialog */}
      {activeDialog === 'create' && <ManualAssignmentDialog />}
      {activeDialog === 'import' && <ExcelImportDialog />}
      {activeDialog === 'edit' && <EditAssignmentDialog />}
    </div>
  )
}
```

DnD handlers:
- `handleDragStart`: set `store.activeDragId`
- `handleDragEnd`: run `validateDrop()`, if valid → call `useMoveAssignment` mutation, if invalid → toast error via Sonner

- [ ] **Step 5: Commit**

```bash
git add client/src/features/scheduler/pages/ client/src/features/scheduler/components/SchedulerToolbar.tsx client/src/features/scheduler/components/SchedulerFilters.tsx client/src/features/scheduler/components/AssignmentLegend.tsx
git commit -m "feat(scheduler): add SchedulerPage with toolbar, filters, legend, and DnD integration"
```

---

## Task 11: Frontend — Mutation Hooks

**Files:**
- Create: `client/src/features/scheduler/hooks/useMoveAssignment.ts`
- Create: `client/src/features/scheduler/hooks/useCreateAssignment.ts`
- Create: `client/src/features/scheduler/hooks/useUpdateAssignment.ts`
- Create: `client/src/features/scheduler/hooks/useDeleteAssignment.ts`
- Create: `client/src/features/scheduler/hooks/useImportAssignments.ts`

- [ ] **Step 1: Create useMoveAssignment with optimistic update**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moveAssignment } from '../api/scheduler.api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useMoveAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MoveAssignmentDto }) =>
      moveAssignment(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any in-flight assignment queries (partial key match works for cancel)
      await queryClient.cancelQueries({ queryKey: ['scheduler', 'assignments'] })

      // Snapshot ALL matching query caches (setQueriesData does partial key matching,
      // unlike setQueryData which requires exact key match)
      const previousEntries: [readonly unknown[], Assignment[] | undefined][] = []
      queryClient.getQueriesData<Assignment[]>({ queryKey: ['scheduler', 'assignments'] })
        .forEach(([key, data]) => {
          previousEntries.push([key, data])
        })

      // Optimistically update all matching caches
      queryClient.setQueriesData<Assignment[]>(
        { queryKey: ['scheduler', 'assignments'] },
        (old) => old?.map((a) =>
          a.id === id
            ? { ...a, departmentId: data.departmentId, startDate: data.startDate, endDate: data.endDate }
            : a
        )
      )
      return { previousEntries }
    },
    onError: (err, _, context) => {
      // Rollback all caches to previous state
      context?.previousEntries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      toast.error(t('dialogs.moveFailed'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
    },
  })
}
```

- [ ] **Step 2: Create remaining mutation hooks**

`useCreateAssignment`, `useUpdateAssignment`, `useDeleteAssignment`, `useImportAssignments` — all follow the same pattern but without optimistic updates (just invalidate on success + toast).

- [ ] **Step 3: Commit**

```bash
git add client/src/features/scheduler/hooks/useMove*.ts client/src/features/scheduler/hooks/useCreate*.ts client/src/features/scheduler/hooks/useUpdate*.ts client/src/features/scheduler/hooks/useDelete*.ts client/src/features/scheduler/hooks/useImport*.ts
git commit -m "feat(scheduler): add mutation hooks with optimistic move and query invalidation"
```

---

## Task 12: Frontend — ManualAssignmentDialog

**Files:**
- Create: `client/src/features/scheduler/components/dialogs/ManualAssignmentDialog.tsx`

- [ ] **Step 1: Create the dialog**

Uses Radix Dialog (from `components/ui/dialog` or directly from `@radix-ui/react-dialog`).
Form uses React Hook Form with `zodResolver(createAssignmentSchema(t))`.

Fields:
- DepartmentSelect: `<Select>` populated from `useDepartments()`
- Start Date: `react-day-picker` with `disabled` prop filtering non-Sundays
- End Date: `react-day-picker` with `disabled` prop filtering non-Thursdays
- University: `<Select>` from `useUniversities()`
- Assignment Type: ToggleGroup (Group/Elective)
- Shift: ToggleGroup (Morning/Evening)
- Student Count: number input
- Year in Program: Select (3-6)
- Tutor Name: text input

Submit calls `useCreateAssignment().mutate()`.
On success: `store.closeDialog()` + toast success.
On error: toast error with server message.

RTL: `dir="rtl"` on dialog content.

- [ ] **Step 2: Commit**

```bash
git add client/src/features/scheduler/components/dialogs/ManualAssignmentDialog.tsx
git commit -m "feat(scheduler): add ManualAssignmentDialog with form validation"
```

---

## Task 13: Frontend — ExcelDropZone + ExcelImportDialog

**Files:**
- Create: `client/src/features/scheduler/components/dialogs/ExcelDropZone.tsx`
- Create: `client/src/features/scheduler/components/dialogs/ExcelImportDialog.tsx`

- [ ] **Step 1: Create ExcelDropZone**

Reusable component for drag-and-drop file upload:
- Native HTML5 drag events (`onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`)
- Accept `.xlsx`, `.xls` only (check MIME type + extension)
- Visual states: idle, dragging-over (highlighted border), file-selected
- "Browse files" button using hidden `<input type="file" accept=".xlsx,.xls">`
- Props: `onFileSelected(file: File)`, `accept?: string`

- [ ] **Step 2: Create ExcelImportDialog**

Uses ExcelDropZone for file selection.
On file selected:
1. Parse with `xlsx` library: `XLSX.read(arrayBuffer, { type: 'array' })`
2. Extract first sheet, convert to JSON
3. Validate columns match expected template (departmentName, startDate, endDate, universityName, type, shiftType, studentCount, yearInProgram, tutorName)
4. If columns don't match → show error state with list of missing/extra columns
5. If valid → show success state with count and column checkmarks
6. Submit button sends parsed data to `useImportAssignments().mutate()`

- [ ] **Step 3: Commit**

```bash
git add client/src/features/scheduler/components/dialogs/ExcelDropZone.tsx client/src/features/scheduler/components/dialogs/ExcelImportDialog.tsx
git commit -m "feat(scheduler): add ExcelDropZone and ExcelImportDialog with column validation"
```

---

## Task 14: Frontend — EditAssignmentDialog + StudentListSection

**Files:**
- Create: `client/src/features/scheduler/components/dialogs/EditAssignmentDialog.tsx`
- Create: `client/src/features/scheduler/components/dialogs/StudentListSection.tsx`

- [ ] **Step 1: Create StudentListSection**

Displays the student table for an assignment:
- Table with columns: First Name, Last Name, National ID, Phone, Email, Delete button
- "Add Student" button → shows inline form row at bottom of table (React Hook Form with studentSchema)
- "Import Excel" button → mini ExcelDropZone with student column schema (firstName, lastName, nationalId, phone, email)
- Header shows count: "רשימת סטודנטים (3/8)" — filled/expected

Uses `addStudent` and `removeStudent` API calls. On add/remove success → refetch assignment detail.

- [ ] **Step 2: Create EditAssignmentDialog**

Triggered when `store.activeDialog === 'edit'`. Fetches assignment detail by `store.editingAssignmentId`.

Layout:
- Summary header: university name, year, type badge, shift badge, student count. "Edit Details" button expands form.
- Collapsible form section: same fields as ManualAssignmentDialog, pre-populated with current values. Uses `useUpdateAssignment()` on save.
- StudentListSection below the form.
- Delete button at bottom → confirmation dialog → `useDeleteAssignment()`

On close: `store.closeDialog()`.

- [ ] **Step 3: Commit**

```bash
git add client/src/features/scheduler/components/dialogs/EditAssignmentDialog.tsx client/src/features/scheduler/components/dialogs/StudentListSection.tsx
git commit -m "feat(scheduler): add EditAssignmentDialog with student list management"
```

---

## Task 15: i18n Translation Files

**Files:**
- Modify: `client/src/locales/en/scheduler.json`
- Modify: `client/src/locales/he/scheduler.json`

- [ ] **Step 1: Complete all translation keys**

Go through every component created and ensure all user-facing text uses `t()` calls. Add all keys to both `en/scheduler.json` and `he/scheduler.json`.

Key groups:
- `title`, `toolbar.*`, `filters.*`, `grid.*`, `card.*`, `status.*`
- `dialogs.manual.*`, `dialogs.import.*`, `dialogs.edit.*`
- `dialogs.validation.*` (all Zod error messages)
- `dialogs.students.*`
- `toast.*` (success/error messages)
- `legend.*`

- [ ] **Step 2: Verify no hardcoded strings**

Search through all scheduler components for any hardcoded user-facing strings. Replace with `t()` calls.

- [ ] **Step 3: Commit**

```bash
git add client/src/locales/
git commit -m "feat(scheduler): complete i18n translations for English and Hebrew"
```

---

## Task 16: Integration + Polish

- [ ] **Step 1: End-to-end manual test**

Start both servers:
```bash
cd /Users/klutz/Desktop/shiba/server && npm run dev
cd /Users/klutz/Desktop/shiba/client && npm run dev
```

Test flow:
1. Navigate to `/scheduler`
2. Select an academic year from dropdown
3. Verify grid renders with departments (rows) and weeks (columns)
4. Verify blocked cells show correct overlays (holidays, date blocks)
5. Create an assignment via Manual Assignment dialog
6. Verify card appears in correct grid cell
7. Drag card to a different cell → verify optimistic update
8. Drag card to a blocked cell → verify snap-back + toast error
9. Click card → verify Edit dialog opens with correct data
10. Add a student to the assignment
11. Import assignments via Excel dialog
12. Test all filters (university, shift, year)
13. Switch language to Hebrew → verify RTL layout + translations

- [ ] **Step 2: Fix any issues found**

Address any bugs, layout issues, or missing translations discovered during testing.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(scheduler): integration polish and bug fixes"
```

---

## Verification

### How to test end-to-end:

1. **Backend**: `cd server && npm run dev` — server on port 3001
2. **Frontend**: `cd client && npm run dev` — Vite on port 5173
3. **Seed data**: `cd server && npx prisma db seed` — creates academic year, departments, constraints
4. **Login**: Use a seeded admin user
5. **Navigate**: Go to `/scheduler`
6. **Full test**: Follow the integration test flow in Task 16

### Key behaviors to verify:
- Grid renders correctly in RTL with sticky department column and sticky week headers
- Multiple cards per cell (morning + evening + electives)
- Drag & drop with optimistic updates and snap-back on invalid drops
- All three dialogs open/close correctly with form validation
- Excel import validates column structure before allowing submission
- Filter changes update grid in real-time
- Status styling (approved/pending/rejected) visible on cards
- All text appears in both English and Hebrew
