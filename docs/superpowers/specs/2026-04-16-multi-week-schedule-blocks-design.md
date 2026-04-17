# Multi-Week Schedule Blocks

## Context

Currently, each assignment in the scheduler is a single week (Sunday–Thursday). When a department needs a rotation spanning multiple consecutive weeks (e.g., a 4-week clinical rotation), users must create 4 independent assignments manually. These assignments have no link to each other — they can be moved independently, broken apart, or displaced individually. This doesn't match the real-world constraint that multi-week rotations are contiguous blocks that must stay together.

This design adds first-class support for **multi-week schedule blocks**: a group of consecutive weekly assignments that move, displace, and validate as a single unit, while allowing each week to have a different shift.

---

## Data Model: `groupId` + `groupIndex` on Assignment

Add two nullable fields to the existing `Assignment` model:

```prisma
model Assignment {
  // ... existing fields ...
  groupId    String?   // UUID shared by all assignments in a block
  groupIndex Int?      // 0-based position within the block (0, 1, 2, ...)

  @@index([groupId])
}
```

**Rules:**
- `groupId = null` → standalone single-week assignment (current behavior, unchanged)
- `groupId = <uuid>` → member of a multi-week block
- `groupIndex` → 0-based position within the block (week 0, week 1, ...)
- All assignments in a group must be in the **same department**, have **consecutive startDates** (7 days apart), and share the same `universityId`, `type`, `yearInProgram`, and `academicYearId`
- Each week in a block can have a **different `shiftType`**

**Why groupId (UUID) instead of an integer FK:**
- No new table needed — minimal schema change
- UUID generation is stateless (no sequence/counter)
- Nullable field means all existing assignments work unchanged

---

## Feature Breakdown

### 1. Multi-Week Creation (ManualAssignmentDialog)

**Current form flow:** User picks department, start date (Sunday), end date (Thursday), university, type, shift, etc. → creates 1 assignment.

**New flow:**
- User picks **start date** (Sunday of first week) and **end date** (Thursday of last week)
- Client computes `N = number of weeks` from the date range
- If `N > 1`, the form expands to show **N shift selectors** (one per week), all defaulting to the same shift
- On submit:
  - Client sends a `CreateBlockDto` with an array of per-week shift types
  - Server generates a UUID `groupId`, creates N assignments in a **single transaction**, each with:
    - Same `departmentId`, `universityId`, `type`, `yearInProgram`, `academicYearId`
    - Sequential `startDate`/`endDate` (week 0, week 1, ...)
    - Respective `shiftType` from the array
    - Same `groupId`, incrementing `groupIndex` (0, 1, 2, ...)

**New DTO:**
```typescript
interface CreateBlockDto {
  departmentId: number
  universityId: number
  academicYearId: number
  startDate: string       // Sunday of first week
  endDate: string         // Thursday of last week
  type: AssignmentType
  yearInProgram: number
  studentCount?: number | null
  tutorName?: string | null
  shifts: ShiftType[]     // one per week, length = N
}
```

**Validation per week:** Each week in the block is validated against the constraint engine independently (capacity, holidays, date blocks). If any week fails validation, the entire block creation fails with details about which week(s) have issues.

### 2. Visual Representation (AssignmentCard)

Each assignment card in the grid shows a **block badge** when it belongs to a group:

- Badge text: `"1/4"`, `"2/4"`, etc. (derived from `groupIndex + 1` / total group size)
- Matching **highlight border or background tint** so all cards in the same block are visually connected
- The block badge uses a subtle distinguishing style (e.g., small pill badge in corner)

**Deriving group size client-side:** A `useBlockGroups()` hook (or computed in the store) creates a `Map<groupId, Assignment[]>` from the assignment list. Each card looks up its group to compute `total` for the badge.

### 3. Block Movement (Drag-and-Drop)

**When dragging an assignment that has a `groupId`:**

1. The entire block is selected (all assignments with same `groupId`)
2. The drag overlay shows the block info (e.g., "Moving 4-week block")
3. On drop:
   - Compute the target position for all N weeks (offset from drop cell)
   - Validate all N target cells against constraints
   - If all valid → execute `moveBlock()` server endpoint (atomic transaction)
   - If any invalid → **auto-suggest valid positions**:
     - Scan all possible contiguous N-week windows in the same department
     - Filter by constraint validation for each week
     - Present valid options in a dialog sorted by proximity to the original drop target

**New server endpoint:** `PATCH /assignments/block/:groupId/move`
```typescript
interface MoveBlockDto {
  departmentId: number
  startDate: string        // Sunday of the first week in the new position
  forceOverride?: boolean
}
```
Server computes all N weeks from `startDate`, validates each, and updates all assignments in a transaction.

### 4. Block Displacement

When a new assignment (or block) lands on a cell occupied by a block member:

1. System identifies the entire block (all assignments with the displaced assignment's `groupId`)
2. System searches for contiguous N-week windows that can accommodate the entire block
3. `ReplacementDialog` shows these contiguous windows as options (not individual weeks)
4. Selected window → server `displaceBlock()` moves all N assignments atomically

**Key rule:** A block is **never split** during displacement. If no contiguous N-week window exists, the displacement is blocked with an error message.

### 5. Block-Aware Suggestion Engine

Extend `findAvailableWeeks()` → `findAvailableBlockPositions()`:

```typescript
function findAvailableBlockPositions(
  departmentId: number,
  blockSize: number,          // N weeks
  shiftTypes: ShiftType[],    // per-week shifts
  excludeGroupId?: string,    // exclude current block's assignments
  academicYearId: number,
  constraints: ConstraintsResponse,
  existingAssignments: Assignment[]
): Array<{ startDate: string; endDate: string }>
```

**Algorithm:**
1. Compute all weeks in the academic year
2. Slide a window of size N across the weeks
3. For each window position, validate each week against constraints (capacity, holidays, blocks) using the respective `shiftType`
4. Return all valid window positions, sorted by proximity to origin

### 6. Import Block Detection

During smart import validation:

1. After resolving department/university names, sort rows by `departmentId + startDate`
2. Group consecutive rows where all match: `departmentId`, `universityId`, `type`, `yearInProgram`
3. Check that dates are consecutive (each startDate is exactly 7 days after the previous)
4. Matching consecutive rows → assign a shared `groupId` and sequential `groupIndex`
5. Validate each block as a unit (all-or-nothing)

**Import execution:** When executing, create all assignments in a block within a single transaction with the shared `groupId`.

### 7. Partial Edit (Detach Week)

User can detach individual weeks from a block:

- **UI:** Right-click or context menu on an assignment card → "Detach from block"
- **Server endpoint:** `PATCH /assignments/:id/detach`
- **Logic:**
  1. Set `groupId = null, groupIndex = null` on the target assignment
  2. Re-index remaining members (`groupIndex` 0, 1, 2, ...)
  3. If detaching from the middle (e.g., week 2 of 4), the block splits into two separate blocks:
     - Weeks 0-1 get a new `groupId` (UUID)
     - Weeks 3 get another new `groupId` (or become standalone if only 1 week)
  4. Validate that resulting blocks still have consecutive dates

**Edge cases:**
- Detaching the first or last week → remaining block shrinks, no split needed, just re-index
- Detaching from a 2-week block → both become standalone (both get `groupId = null`)
- Detaching the middle → splits into two blocks (each gets a new UUID)

---

## API Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/assignments/block` | Create a multi-week block |
| PATCH | `/assignments/block/:groupId/move` | Move entire block to new position |
| POST | `/assignments/block/:groupId/displace` | Displace a block to make room |
| PATCH | `/assignments/:id/detach` | Detach one week from a block |
| POST | `/assignments/block/find-positions` | Find valid positions for a block |

Existing single-week endpoints remain unchanged.

---

## Files to Modify

**Server:**
- `server/prisma/schema.prisma` — Add `groupId`, `groupIndex`, `@@index([groupId])`
- `server/src/modules/assignment/assignment.schema.ts` — Add block creation/move Zod schemas
- `server/src/modules/assignment/assignment.service.ts` — Add `createBlock()`, `moveBlock()`, `displaceBlock()`, `detachFromBlock()`
- `server/src/modules/assignment/assignment.controller.ts` — Add block endpoints
- `server/src/modules/assignment/suggestion-engine.ts` — Add `findAvailableBlockPositions()`
- `server/src/modules/assignment/import-validation.service.ts` — Add block detection in import

**Client:**
- `client/src/features/scheduler/types/scheduler.types.ts` — Add `groupId`, `groupIndex` to Assignment; add `CreateBlockDto`
- `client/src/features/scheduler/stores/schedulerStore.ts` — Add block grouping computed state
- `client/src/features/scheduler/components/dialogs/ManualAssignmentDialog.tsx` — Multi-week shift selectors
- `client/src/features/scheduler/components/grid/AssignmentCard.tsx` — Block badge
- `client/src/features/scheduler/pages/SchedulerPage.tsx` — Block-aware drag-drop
- `client/src/features/scheduler/components/dialogs/ReplacementDialog.tsx` — Block-aware suggestions
- `client/src/features/scheduler/utils/assignmentValidator.ts` — Block validation helpers
- `client/src/locales/en/scheduler.json` — New translation keys
- `client/src/locales/he/scheduler.json` — New translation keys

---

## Verification Plan

1. **Unit test: Block creation** — Create a 3-week block, verify 3 assignments share `groupId` with `groupIndex` 0, 1, 2
2. **Unit test: Block movement** — Move a 3-week block, verify all 3 assignments update atomically
3. **Unit test: Block displacement** — Displace a 2-week block, verify it finds contiguous 2-week windows
4. **Unit test: Detach** — Detach middle week from 4-week block, verify split into 2 blocks + 1 standalone
5. **Unit test: Import block detection** — Import 4 consecutive matching rows, verify they get grouped
6. **E2E: Create multi-week** — Open creation dialog, pick 3-week range, set different shifts, submit, verify 3 linked cards on grid
7. **E2E: Drag block** — Drag a multi-week block to a new position, verify all weeks move together
8. **E2E: Block badge** — Verify cards show "1/3", "2/3", "3/3" badges
9. **E2E: Auto-suggest** — Drag block to invalid position, verify suggestion dialog with valid contiguous positions
10. **E2E: Detach week** — Right-click week in block, detach, verify block updates visually
