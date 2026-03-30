# Scheduling Constraint System

## Architecture Overview

The constraint system uses a **dual-layer** architecture: a synchronous client-side validator for instant UI feedback and an async server-side engine for authoritative enforcement.

```
 Client (Browser)                          Server
 ┌──────────────────────┐                  ┌──────────────────────────┐
 │ useBlockedCells()    │  pre-computes    │ constraintEngine.ts      │
 │   → blocked cell map │  blocked cells   │   → rule registry (Map)  │
 │                      │                  │   → validate() loop      │
 │ assignmentValidator  │  drag-drop &     │                          │
 │   → validateDrop()   │  manual create   │ importService.ts         │
 │   → 10+ checks       │                  │   → 9-step per-row check │
 │                      │                  │   → bump logic           │
 │ findAvailableWeeks() │  suggestions     │ suggestionEngine.ts      │
 │   → closest valid wk │  for displaced   │   → closest valid weeks  │
 └──────────────────────┘                  └──────────────────────────┘
```

**Data flow:** The scheduler page fetches constraints via `GET /constraints?year=...` (5-minute stale time). `useBlockedCells` pre-computes a `Map<string, BlockReason>` from holidays, date constraints, department blocked dates, and soft constraints. This map plus the assignments list form the `ValidationContext` passed to `validateDrop()`.

---

## Constraint Types and DB Models

Six database models back the constraint system. All are defined in `server/prisma/schema.prisma`.

### 1. IronConstraint

Toggle-controlled rule flags. Each record's `name` must match a key in the server's `ruleRegistry` map.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | Auto-increment PK |
| `name` | String | **Unique.** Must match `ruleRegistry` key |
| `description` | String | Human-readable explanation |
| `isActive` | Boolean | Toggleable by admins |

Seeded with 5 records: `SEMESTER_BOUNDARY`, `STUDENT_DOUBLE_BOOKING`, `FIRST_CLINICAL_ROTATION`, `ONE_GROUP_PER_SHIFT`, `CAPACITY_LIMIT`.

### 2. DateConstraint

Global date-range blocks (e.g., institution-wide closures that aren't holidays). Blocks all departments for overlapping weeks.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | Auto-increment PK |
| `name` | String | |
| `description` | String | |
| `startDate` | DateTime | |
| `endDate` | DateTime | |
| `isActive` | Boolean | Toggleable by admins |

### 3. SoftConstraint

Named advisory constraints with optional department/university scope and date range. **Despite the name, the UI treats these as hard blocks.**

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | Auto-increment PK |
| `name` | String | |
| `description` | String | |
| `priority` | Int | |
| `isActive` | Boolean | |
| `departmentId` | Int? | Optional FK to `Department` |
| `universityId` | Int? | Optional FK to `University` |
| `startDate` | DateTime? | |
| `endDate` | DateTime? | |

### 4. Holiday

Hospital-wide closure days. Blocks all cells for the week containing the holiday date.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | Auto-increment PK |
| `name` | String | |
| `date` | DateTime | |
| `isFullDay` | Boolean | |
| `year` | Int | |
| `isActive` | Boolean | |

Unique constraint: `(name, year)`.

### 5. DepartmentConstraint

Per-department capacity limits and optional blackout date ranges. Created in a transaction alongside each `Department` record.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | Auto-increment PK |
| `departmentId` | Int | FK to `Department` |
| `morningCapacity` | Int | Max students for morning shift |
| `eveningCapacity` | Int | Max students for evening shift |
| `electiveCapacity` | Int | Max electives per slot |
| `blockedStartDate` | DateTime? | Optional blackout start |
| `blockedEndDate` | DateTime? | Optional blackout end |

### 6. UniversitySemester

Defines valid date windows per university per academic year. Used by the `SEMESTER_BOUNDARY` rule.

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int | Auto-increment PK |
| `universityId` | Int | FK to `University` |
| `semesterStart` | DateTime | |
| `semesterEnd` | DateTime | |
| `year` | Int | |

Unique constraint: `(universityId, year)`.

---

## Server-Side Constraint Engine

**File:** `server/src/modules/assignment/validation/constraintEngine.ts`

### Rule Registry

The engine uses a `Map<string, RuleFunction>` as a registry. At validation time it fetches all active `IronConstraint` rows from the DB and iterates them in insertion order (`id ASC`), looking up each by `name` in the registry map.

### Registered Rules

| Rule | Applies To | Violation Type | Behavior |
|------|-----------|----------------|----------|
| `SEMESTER_BOUNDARY` | All | `warning` or `error` | Checks `startDate`/`endDate` fall within the `UniversitySemester` record. No semester record = warning; outside range = error. |
| `ONE_GROUP_PER_SHIFT` | GROUP only | `error` | Queries for another APPROVED/PENDING GROUP on the same department + shift + overlapping date range. |
| `CAPACITY_LIMIT` | GROUP + ELECTIVE | `warning` or `error` | GROUP: checks `studentCount` against `morningCapacity`/`eveningCapacity`. ELECTIVE: counts existing electives against `electiveCapacity`. No `DepartmentConstraint` row = warning; over capacity = error. |
| `FIRST_CLINICAL_ROTATION` | Year 1 only | `warning` | Checks if department is in the allowed list (Internal Medicine / Pediatrics). Never blocks — advisory only. |

### STUDENT_DOUBLE_BOOKING (Special Case)

This constraint is **not** in the `ruleRegistry`. It is a separately exported function `validateStudentLink()` called directly from `AssignmentService.addStudent()`. It checks the `IronConstraint` table for an active record with `name === 'STUDENT_DOUBLE_BOOKING'` before executing. This means:
- It can be toggled off via the admin UI
- It does NOT run through the `validate()` loop
- It only fires when linking a student to an assignment, not during create/move/import

### Effective Execution Order

Since `STUDENT_DOUBLE_BOOKING` has no registry entry, the `validate()` loop runs:

1. `SEMESTER_BOUNDARY`
2. `FIRST_CLINICAL_ROTATION`
3. `ONE_GROUP_PER_SHIFT`
4. `CAPACITY_LIMIT`

All active rules run; violations accumulate. After all rules complete:
- **Any `error`-type violations:** throws `ConstraintValidationError` (HTTP 422) — hard block.
- **Only `warning`-type violations:** returns the warnings array — caller proceeds.

### ConstraintValidationError

Defined in `server/src/shared/errors/ConstraintValidationError.ts`. Extends `AppError` with HTTP 422. Serialized by `errorHandler` middleware as:

```json
{ "message": "...", "errors": [...], "warnings": [...] }
```

---

## Client-Side Validator

**File:** `client/src/features/scheduler/validators/assignmentValidator.ts`

Fully synchronous, in-memory validator. Runs before any network call on drag-drop and manual assignment creation.

### Check Order in `validateDrop()`

| # | Check | Returns |
|---|-------|---------|
| 1 | Department blocked date range (`blockedCells` map key `dept:{deptId}:week:{N}`) | `blocked` |
| 2 | Holiday block (`holiday:week:{N}`) | `blocked` |
| 3 | Date constraint block (`dateConstraint:week:{N}`) | `blocked` |
| 4 | Soft constraint block (`soft:dept:{deptId}:week:{N}` or `soft:week:{N}`) | `blocked` |
| 5 | Cross-department conflict (same university + year + shift, different dept) | `conflict_replaceable` |
| 6 | GROUP capacity = 0 for that shift | `blocked` |
| 7 | GROUP too big for capacity | non-admin: `blocked`, admin: `conflict_admin_override` |
| 8 | One group per shift per week (priority comparison) | `conflict_replaceable` / `conflict_same_priority` / `blocked` or `conflict_admin_override` |
| 9 | ELECTIVE capacity exceeded | non-admin: `blocked`, admin: `conflict_admin_override` |
| 10 | Iron constraints loop: `SEMESTER_BOUNDARY` | `blocked` |
| 11 | Iron constraints loop: `FIRST_CLINICAL_ROTATION` | `warning` |

If all checks pass, returns `{ type: 'valid' }`.

### Result Types

```typescript
type ValidationResult =
  | { type: 'valid' }
  | { type: 'blocked'; reasonKey: string; reasonParams? }
  | { type: 'warning'; reasonKey: string; reasonParams? }
  | { type: 'conflict_replaceable'; displacedAssignment; incomingPriority; displacedPriority }
  | { type: 'conflict_same_priority'; existingAssignment; reasonKey }
  | { type: 'conflict_admin_override'; reasonKey; reasonParams? }
```

### Client vs. Server Differences

| Aspect | Client | Server |
|--------|--------|--------|
| Execution | Synchronous, in-memory | Async, DB queries |
| `ONE_GROUP_PER_SHIFT` | Scans loaded `existingAssignments` array | DB query with status filter |
| `CAPACITY_LIMIT` (elective) | Counts assignments in-memory | DB `count` query |
| `STUDENT_DOUBLE_BOOKING` | **Not checked** | Checked via `validateStudentLink()` |
| Soft constraints | Pre-computed into `blockedCells` as hard blocks | Checked in `importService` step 7 |
| Dept blocked dates | Pre-computed into `blockedCells` | Checked in `importService` step 4; **not** checked by `constraintEngine.validate()` |

---

## Admin Override Behavior

### Client-Side Flow

When `validateDrop()` returns `conflict_admin_override` or `conflict_same_priority` and the user is an admin, `SchedulerPage` opens `AdminOverrideDialog` — an amber-colored confirmation dialog. On confirm, the move/create mutation fires **without** `forceOverride: true`.

### The Client/Server Gap

The `forceOverride` parameter exists in the server API (`AssignmentService.create`, `.move`) and is passed to `engine.validate()`. However, inside `validate()`, **the parameter is unused** — error-type violations always throw regardless of `forceOverride`. This means:

- Admin override on the client bypasses client-side checks via the dialog
- But the server re-validates independently and will reject with 422 if a hard rule fires
- The `forceOverride` flag is effectively **vestigial** on the server

The only true server-side admin bypass is `force_create` in the smart import execute phase, which skips `engine.validate()` entirely (requires `SUPER_ADMIN` or `ADMIN` role).

### Route-Level Authorization

All constraint toggle/CRUD endpoints require `SUPER_ADMIN` or `ADMIN` role via `authorize()` middleware.

---

## Smart Import Constraint Flow

**Files:**
- `server/src/modules/assignment/import/importService.ts`
- `server/src/modules/assignment/import/suggestionEngine.ts`
- `server/src/modules/assignment/import/nameResolver.ts`

### Phase 1: Validate (`POST /assignments/import/validate`)

Rows are processed **sequentially** (order matters). Two pieces of virtual state track within-batch conflicts:

- `virtuallyOccupied: Set<string>` — tracks `dept:shift:date` keys claimed by earlier rows
- `virtuallyDisplacedIds: Set<number>` — tracks IDs already bumped by earlier rows

**Per-row validation steps:**

| Step | Check | Notes |
|------|-------|-------|
| 1 | Name resolution | Hebrew strings → department, university, shift type, placement type |
| 1.5 | Department shift availability | `hasMorningShift` / `hasEveningShift` flags |
| 2 | Holiday overlap | DB query |
| 3 | Date constraint overlap | DB query |
| 4 | Department blocked dates | `blockedStartDate` / `blockedEndDate` |
| 5 | Virtual occupation check | GROUP only — same-batch conflict |
| 6 | Duplicate assignment check | Exact match in DB (APPROVED + PENDING) |
| 7 | Soft constraint check | DB query for active soft constraints matching dept + date range |
| 8 | `ConstraintEngine.validate()` | All active iron constraints |
| 9 | Bump logic (if `ONE_GROUP_PER_SHIFT` fires) | Priority comparison + suggestion engine |

### Bump Logic

When `ONE_GROUP_PER_SHIFT` fires for a GROUP assignment:
1. Fetch both universities' `priority` values (lower number = higher priority)
2. If incoming has strictly lower priority number → **bump** the existing assignment
3. Mark slot as virtually occupied, displaced ID as virtually displaced
4. Call `findSuggestedWeeks()` for up to 3 alternative weeks for the displaced assignment
5. If incoming priority >= existing → **fail** with `grid.blocked.lowerPriority` or `grid.blocked.samePriority`

### Phase 2: Execute (`POST /assignments/import/execute`)

Takes an `actions[]` array. Three action types:

| Action | Behavior |
|--------|----------|
| `create` | Re-runs `engine.validate()` in a Prisma transaction, then creates as APPROVED |
| `displace` | Re-validates both incoming and displaced positions, then moves existing + creates new |
| `force_create` | **Skips `engine.validate()` entirely.** Admin-only. |

All actions run inside a single `prisma.$transaction`. Any `engine.validate()` failure rolls back the entire batch.

### Suggestion Engine

**File:** `server/src/modules/assignment/import/suggestionEngine.ts`

Iterates all Sunday–Thursday week windows in the academic year, sorted by proximity to the conflicting date. For each candidate week, checks: holidays, date constraints, department blocked dates, and `ConstraintEngine.validate()`. Returns the first 3 valid weeks.

---

## Blocked Cells Pre-Computation

**File:** `client/src/features/scheduler/hooks/useBlockedCells.ts`

Runs inside `useMemo` in `SchedulerPage` and `ManualAssignmentDialog`. Produces a `Map<string, BlockReason>` with four key patterns:

| Key Pattern | Source | Scope |
|-------------|--------|-------|
| `holiday:week:{N}` | `constraints.holidays` | All departments |
| `dept:{deptId}:week:{N}` | `DepartmentConstraint.blockedStartDate/End` | Per department |
| `dateConstraint:week:{N}` | Active `DateConstraint` records | All departments |
| `soft:dept:{deptId}:week:{N}` | Active `SoftConstraint` with `departmentId` | Per department |
| `soft:week:{N}` | Active `SoftConstraint` without `departmentId` | All departments |

This map is consumed by:
1. **`GridCell`** — uses `blockReason` to disable the droppable target and render `BlockedOverlay`
2. **`validateDrop()`** — checks 1–4 in the validation order above

The pre-computation is read-only and does not include GROUP/ELECTIVE assignment conflicts — those are computed dynamically by `validateDrop()` scanning `existingAssignments`.

---

## File Reference

### Server — Constraint Engine & Validation

| File | Role |
|------|------|
| `server/src/modules/assignment/validation/constraintEngine.ts` | Rule registry, `validate()` loop, `validateStudentLink()` |
| `server/src/shared/errors/ConstraintValidationError.ts` | Error class with `errors[]` and `warnings[]`, HTTP 422 |
| `server/src/shared/middlewares/errorHandler.ts` | Serializes constraint errors to JSON response |

### Server — Assignment Operations

| File | Role |
|------|------|
| `server/src/modules/assignment/assignment.service.ts` | Orchestrates validation for create, move, displace, addStudent |
| `server/src/modules/assignment/assignment.controller.ts` | Express handlers; passes `forceOverride` from request body |
| `server/src/modules/assignment/assignment.routes.ts` | Route definitions; all require authentication |
| `server/src/modules/assignment/assignment.schema.ts` | Zod schemas; `startDate` must be Sunday, `endDate` must be Thursday |

### Server — Smart Import

| File | Role |
|------|------|
| `server/src/modules/assignment/import/importService.ts` | 9-step per-row validation, bump logic, virtual state |
| `server/src/modules/assignment/import/importTypes.ts` | `SmartImportRow`, `ImportRowResult`, `ImportAction` types |
| `server/src/modules/assignment/import/suggestionEngine.ts` | Find closest available weeks with full constraint checking |
| `server/src/modules/assignment/import/nameResolver.ts` | Hebrew name → DB entity resolution |

### Server — Constraint Management

| File | Role |
|------|------|
| `server/src/modules/constraint/constraint.controller.ts` | Express handlers for all constraint CRUD/toggle |
| `server/src/modules/constraint/constraint.routes.ts` | All endpoints gated by `adminOnly` middleware |
| `server/src/modules/constraint/constraint.service.ts` | Business logic; `getConstraintsForYears` for scheduler data |
| `server/src/modules/constraint/constraint.repository.ts` | Prisma queries; transactional department/university creation |
| `server/src/modules/constraint/constraint.schema.ts` | Zod DTOs for all constraint operations |

### Server — Database

| File | Role |
|------|------|
| `server/prisma/schema.prisma` | All 6 constraint models defined here |
| `server/prisma/seed.ts` | Seeds 5 iron constraints, sample holidays, department constraints |

### Client — Scheduler Validation

| File | Role |
|------|------|
| `client/src/features/scheduler/validators/assignmentValidator.ts` | Synchronous client-side `validateDrop()` with 10+ checks |
| `client/src/features/scheduler/validators/findAvailableWeeks.ts` | Client-side suggestion engine using `validateDrop` |
| `client/src/features/scheduler/hooks/useBlockedCells.ts` | Memoized pre-computation of blocked cell map |
| `client/src/features/scheduler/hooks/useConstraints.ts` | React Query hook for `GET /constraints?year=...` |
| `client/src/features/scheduler/types/scheduler.types.ts` | `ValidationResult`, `BlockReason`, `ConstraintsResponse` types |
| `client/src/features/scheduler/api/scheduler.api.ts` | HTTP calls to assignment and constraint endpoints |

### Client — Scheduler UI

| File | Role |
|------|------|
| `client/src/features/scheduler/pages/SchedulerPage.tsx` | Top-level wiring: builds `ValidationContext`, handles drag results |
| `client/src/features/scheduler/components/grid/GridCell.tsx` | Renders blocked overlay or drop target based on `blockReason` |
| `client/src/features/scheduler/components/dialogs/AdminOverrideDialog.tsx` | Amber confirmation dialog for admin overrides |
| `client/src/features/scheduler/components/dialogs/ManualAssignmentDialog.tsx` | Runs `validateDrop` before calling create |

### Client — Scheduler Mutations

| File | Role |
|------|------|
| `client/src/features/scheduler/hooks/useCreateAssignment.ts` | Parses 422 responses, maps `messageKey` to toast errors |
| `client/src/features/scheduler/hooks/useMoveAssignment.ts` | Optimistic update with rollback on 422 |
| `client/src/features/scheduler/hooks/useDisplaceAssignment.ts` | Same 422 error parsing pattern |

### Client — Constraint Management

| File | Role |
|------|------|
| `client/src/features/constraints/pages/ConstraintsPage.tsx` | Admin UI for managing constraints (Hard + Soft tabs) |
| `client/src/features/constraints/types/constraints.types.ts` | Management-side type definitions |
| `client/src/features/constraints/api/constraints.api.ts` | HTTP calls for `GET /constraints/management` and all mutations |
