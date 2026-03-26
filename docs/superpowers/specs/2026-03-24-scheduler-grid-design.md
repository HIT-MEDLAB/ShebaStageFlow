# Scheduler Grid View — Design Spec

## Context

Shiba Hospital's teaching authority needs a central scheduling interface to manage clinical rotation assignments for medical students across departments and weeks. The current process is manual/inefficient. This screen is the core of the platform — a grid-based view where admins and academic coordinators create, view, edit, and move assignments via drag-and-drop.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DnD library | `@dnd-kit/core` | React hooks API, best RTL/accessibility support, built-in snap-back |
| Grid layout | CSS Grid + sticky headers | Native performance, full visual control, clean dnd-kit integration |
| State (server) | TanStack React Query | Already used in project; caching, optimistic updates, invalidation |
| State (UI) | Zustand store | Already used in project (themeStore); filters, dialog state, drag state |
| Validation | Hybrid client+server | Client-side for instant UX; server re-validates for concurrency safety |
| Forms | React Hook Form + Zod | Existing project pattern with i18n schema factories |
| Excel parsing | `xlsx` (SheetJS) | Client-side file reading + column validation |
| Date picker | `react-day-picker` | Lightweight, Radix-compatible, supports day filtering (Sunday/Thursday) |
| Dialogs | Radix Dialog | Matches existing OtpDialog pattern |

## Component Hierarchy

```
SchedulerPage
├── SchedulerToolbar
│   ├── Button: Manual Assignment → ManualAssignmentDialog
│   └── Button: Import Excel → ExcelImportDialog
├── SchedulerFilters
│   ├── WeekRangeSelector
│   ├── UniversityFilter (multi-select dropdown)
│   ├── ShiftFilter (Morning/Evening toggle)
│   ├── YearFilter (dropdown)
│   └── AssignmentLegend (color key)
├── DndContext (@dnd-kit/core)
│   ├── SchedulerGrid (CSS Grid container)
│   │   ├── GridHeader (sticky top)
│   │   │   ├── DepartmentColumnHeader (sticky right for RTL)
│   │   │   └── WeekColumnHeader × N
│   │   └── GridRow × N (one per department)
│   │       ├── DepartmentLabel (sticky right)
│   │       └── GridCell × N (droppable zone: dept × week)
│   │           ├── BlockedOverlay (if constraint blocks slot)
│   │           └── AssignmentCard × 0-N (draggable)
│   └── DragOverlay (floating ghost card)
├── ManualAssignmentDialog
├── ExcelImportDialog
└── EditAssignmentDialog
    └── StudentListSection
```

### Key Component Responsibilities

- **SchedulerGrid**: CSS Grid with `position: sticky` for frozen department column (right side, RTL) and week headers (top). Scrolls horizontally for ~16-20 week columns, vertically for 20-50 department rows.
- **GridCell**: Droppable zone identified by `{departmentId, weekNumber}`. Can hold multiple cards (morning group + evening group + electives). Renders `BlockedOverlay` when constraints prevent scheduling.
- **AssignmentCard**: Draggable card displaying university name, year, type badge (Group/Elective), shift badge, and student count ("-" if empty). Color-coded by university. Visual differentiation by assignment status: approved = solid, pending = dashed border, rejected = dimmed/strikethrough.
- **DragOverlay**: Renders a ghost copy of the card that follows the cursor during drag. Original card stays in place with reduced opacity.

## State Management

### Server State (React Query)

| Hook | Purpose | Cache behavior |
|------|---------|---------------|
| `useAssignments(academicYear, filters)` | All assignments for grid, scoped by academic year | Invalidate on create/update/move/delete |
| `useDepartments()` | Department list for Y-axis | Long-lived cache (rarely changes) |
| `useUniversities()` | University list for filters + form selects | Long-lived cache (rarely changes) |
| `useConstraints(academicYear)` | All constraints for validation + blocked cells | Invalidate on constraint changes |
| `useAcademicYearWeeks(academicYear)` | Week definitions for X-axis headers (computed from year's date range) | Long-lived cache |

### Mutations (with optimistic updates)

| Mutation | Trigger | Optimistic? |
|----------|---------|-------------|
| `useMoveAssignment()` | Drag & drop | Yes — move card in cache, rollback on server rejection |
| `useCreateAssignment()` | Manual dialog submit | No — invalidate query on success |
| `useUpdateAssignment()` | Edit dialog save | No — invalidate query on success |
| `useDeleteAssignment()` | Edit dialog delete | No — invalidate query on success |
| `useImportAssignments()` | Excel import submit | No — invalidate query on success |

### Client State (Zustand)

```typescript
interface SchedulerStore {
  // Scope
  academicYearId: number | null

  // Filters
  selectedUniversities: number[]
  selectedShift: 'all' | 'morning' | 'evening'
  selectedYear: number | null

  // Dialog state
  activeDialog: null | 'create' | 'import' | 'edit'
  editingAssignmentId: number | null

  // Drag state
  activeDragId: number | null

  // Actions
  setFilter(key, value): void
  openDialog(type, assignmentId?): void
  closeDialog(): void
  setAcademicYear(yearId: number): void
}
```

### Derived State (useMemo hooks)

- **`useGridData()`**: Combines assignments + filters → `Map<deptId, Map<weekNum, Assignment[]>>`
- **`useBlockedCells()`**: Combines constraints + holidays → `Map<cellKey, BlockReason>`

## Grid Scoping

The grid is scoped by **academic year** (e.g., "2025-2026"). A new `AcademicYear` model will be added to the Prisma schema with `id`, `name` (e.g., "2025-2026"), `startDate`, and `endDate` fields. Admins can define academic years. The `useAcademicYearWeeks()` hook computes week definitions (Sunday-to-Thursday blocks) from the year's `startDate`/`endDate`.

An academic year selector in the toolbar (or page header) lets users switch between years. The selected year ID is stored in the Zustand store and used as a parameter for all data-fetching hooks.

**New Prisma model required:**
```prisma
model AcademicYear {
  id        Int      @id @default(autoincrement())
  name      String   @unique // e.g., "2025-2026"
  startDate DateTime
  endDate   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Assignment Status Display

All assignments are shown in the grid regardless of status, with visual differentiation:

| Status | Visual Treatment |
|--------|-----------------|
| **APPROVED** | Solid background, full opacity — default look |
| **PENDING** | Dashed border, slightly reduced opacity (0.85) — signals "awaiting approval" |
| **REJECTED** | Dimmed (opacity 0.5), strikethrough on university name — clearly not active |

All statuses are draggable. Status does not change on drag — only position changes.

## Constraint Validation

### Constraint Types → Visual Rules

| Constraint | Visual | Drop behavior |
|-----------|--------|---------------|
| **DepartmentConstraint (date block)** | Cell grayed out + lock icon + tooltip | Drop rejected, card snaps back |
| **Holiday** | Cell grayed out + holiday icon + name tooltip | Drop rejected, card snaps back |
| **DepartmentConstraint (capacity)** | Warning icon when full for a shift type | Drop rejected for that shift, toast explains which capacity is full |
| **IronConstraint** (dynamic rules from DB) | Not visually blocked | Drop rejected + toast with constraint description |

### DepartmentConstraint Dual Nature

The `DepartmentConstraint` Prisma model combines both capacity fields (`morningCapacity`, `eveningCapacity`, `electiveCapacity`) and date-blocking fields (`blockedStartDate`, `blockedEndDate`) in a single record. When building `useBlockedCells()`:

- If a `DepartmentConstraint` has `blockedStartDate`/`blockedEndDate` set → treat as a **date block** (fully blocked cell)
- Capacity fields are always present → check against current assignment count for that shift in that cell
- A single record can trigger both: a date block for certain weeks AND capacity limits for non-blocked weeks

### Holiday-to-Week Mapping

The `Holiday` model has a single `date` field. To determine if a week cell is blocked: check if any holiday date falls within the week's Sunday-to-Thursday range. If a holiday falls on any day in that range, the **entire week cell** is blocked for that department (hospital-wide closure).

### Blocked Cell Visual States

1. **Empty** — white, accepts drops
2. **Holiday blocked** — gray background, dashed border, holiday icon + name
3. **Date blocked** — light red background, dashed border, lock icon
4. **Capacity full** — yellow border, warning icon (shift-specific — morning full doesn't block evening)

### Client-Side Validation Engine

```typescript
// validators/assignmentValidator.ts
type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string; reasonKey: string }

function validateDrop(
  assignment: Assignment,
  targetCell: { departmentId: string; weekNumber: number },
  context: {
    blockedCells: Map<string, BlockReason>
    existingAssignments: Assignment[]
    constraints: Constraint[]
  }
): ValidationResult
```

Runs synchronously during drag hover (visual feedback: green/red cell highlight) and on drop (final check). Server re-validates on the PATCH API call.

**Iron constraints are dynamic:** The `IronConstraint` model stores configurable rules (name, description, isActive). The client-side validator fetches active iron constraints via `useConstraints()` and applies them during validation. Rules like "1 group per department per shift" are read from the DB, not hardcoded. The validator maps known constraint types to validation functions.

### Drag & Drop Flow

1. User starts drag → `DndContext.onDragStart` → `store.setActiveDragId()`
2. Card follows cursor via `DragOverlay`
3. Hover over cell → GridCell highlights (green = valid, red = blocked)
4. User drops → `DndContext.onDragEnd` fires
5. Client validates via `validateDrop()`
6. If invalid → snap back + Sonner toast with reason
7. If valid → optimistic cache update (move card)
8. API call: `PATCH /assignments/:id/move`
9. Server rejects → rollback optimistic update + toast
10. Server confirms → invalidate assignments query

## Dialogs

### A. Manual Assignment Dialog

Form fields (React Hook Form + Zod):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Department | Select (from useDepartments) | Yes | Must exist |
| Start Date | Date picker (Sundays only) | Yes | Must be a Sunday |
| End Date | Date picker (Thursdays only) | Yes | Must be a Thursday, after start |
| University | Select (from useUniversities) | Yes | Must exist |
| Assignment Type | Toggle: Group / Elective | Yes | — |
| Shift | Toggle: Morning / Evening | Yes | — |
| Number of Students | Number input | No | Positive integer |
| Year in Program | Select (3-6) | Yes | — |
| Tutor Name | Text input | No | — |

Date pickers use `react-day-picker` with `disabled` prop filtering to only allow Sundays (start) and Thursdays (end).

### B. Excel Import Dialog

- Drag & drop zone using native HTML5 drag events (separate from dnd-kit)
- "Browse files" button as fallback
- Accepts `.xlsx`, `.xls` only
- On file drop: parse with `xlsx` library, validate columns match expected template
- Show validation status: column checkmarks on success, error message on mismatch
- Preview count: "15 assignments found"
- Submit sends parsed data to `POST /assignments/import`

### C. Edit Assignment Dialog

- Triggered by clicking an AssignmentCard in the grid
- Shows assignment summary header (university, year, type, count) with "Edit Details" button
- Expandable form section (same fields as Manual Assignment)
- **Student List Section:**
  - Table: First Name, Last Name, National ID, Phone, Email, Delete button
  - "Add Student" button → inline form row
  - "Import Excel" button → mini dropzone for student list (same xlsx validation, different column schema)
  - Student count header shows "3/8" (filled/expected)
- Delete Assignment button (with confirmation)

## File Structure

Following the existing Feature-Sliced Design pattern:

```
features/scheduler/
├── pages/
│   └── SchedulerPage.tsx
├── components/
│   ├── SchedulerToolbar.tsx
│   ├── SchedulerFilters.tsx
│   ├── AssignmentLegend.tsx
│   ├── grid/
│   │   ├── SchedulerGrid.tsx
│   │   ├── GridHeader.tsx
│   │   ├── GridRow.tsx
│   │   ├── GridCell.tsx
│   │   ├── AssignmentCard.tsx
│   │   ├── BlockedOverlay.tsx
│   │   └── DragOverlay.tsx
│   └── dialogs/
│       ├── ManualAssignmentDialog.tsx
│       ├── ExcelImportDialog.tsx
│       ├── EditAssignmentDialog.tsx
│       ├── StudentListSection.tsx
│       └── ExcelDropZone.tsx (shared between import & student list)
├── hooks/
│   ├── useAssignments.ts
│   ├── useDepartments.ts
│   ├── useUniversities.ts
│   ├── useConstraints.ts
│   ├── useAcademicYearWeeks.ts
│   ├── useMoveAssignment.ts
│   ├── useCreateAssignment.ts
│   ├── useUpdateAssignment.ts
│   ├── useImportAssignments.ts
│   ├── useGridData.ts
│   └── useBlockedCells.ts
├── api/
│   └── scheduler.api.ts
├── types/
│   └── scheduler.types.ts
├── schemas/
│   ├── assignmentSchema.ts
│   └── studentSchema.ts
├── validators/
│   └── assignmentValidator.ts
├── stores/
│   └── schedulerStore.ts
└── index.ts
```

## New Dependencies

| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` | Drag and drop core |
| `@dnd-kit/utilities` | CSS transform utilities for dnd-kit |
| `react-day-picker` | Date picker with day filtering |
| `xlsx` | Client-side Excel file parsing |
| `date-fns` | Date manipulation (week calculations, formatting) |

## i18n

All user-facing text goes through `react-i18next` using a `scheduler` namespace:
- `locales/en/scheduler.json`
- `locales/he/scheduler.json`

Zod schemas use the factory pattern: `createAssignmentSchema(t)` accepting `TFunction`.

## Backend Prerequisites

The following API endpoints need to be built (following existing Express + Prisma + Zod pattern from `server/src/modules/university/`):

| Endpoint | Purpose |
|----------|---------|
| `GET /departments` | List all departments (Y-axis) |
| `GET /assignments?academicYear=X&...filters` | List assignments for grid |
| `POST /assignments` | Create assignment (manual dialog) |
| `PATCH /assignments/:id` | Update assignment (edit dialog) |
| `PATCH /assignments/:id/move` | Move assignment to new dept/week (DnD) |
| `DELETE /assignments/:id` | Delete assignment |
| `POST /assignments/import` | Bulk import from Excel |
| `GET /constraints?academicYear=X` | List all constraints for the year |
| `GET /holidays?year=X` | List holidays for the year |
| `POST /assignments/:id/students` | Add student to assignment |
| `DELETE /assignments/:id/students/:studentId` | Remove student |
| `POST /assignments/:id/students/import` | Bulk import students from Excel |

These can be built in parallel with the frontend (frontend uses mock data initially).

## RTL Considerations

- CSS Grid: department column sticky on **right** (not left)
- Use Tailwind `start`/`end` classes instead of `left`/`right`
- dnd-kit uses CSS transforms (not HTML5 drag) — RTL works naturally
- Dialog content direction set via `dir="rtl"`
- Date picker configured for Hebrew locale

## Role Behavior

Both Admin and Academic Coordinator roles see the same scheduler grid UI with the same features (create, edit, drag & drop, import). The only difference is in approval flow: coordinator-created assignments that conflict go to PENDING status for admin approval. This is handled server-side — the frontend does not differentiate roles on this screen.

## Notes

- All entity IDs are `number` (matching Prisma `Int` primary keys), not strings
- `DateConstraint` model from the schema is not relevant to grid cell blocking — it defines date-based rules that are checked server-side during assignment creation, not visual grid state
