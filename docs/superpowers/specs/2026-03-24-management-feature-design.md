# Management Feature - Constraints Management Screen

## Context

The Shiba Hospital scheduling platform needs a Management screen where admins can configure the scheduling rules that govern the algorithm. This is the first screen admins interact with — setting up the "laws" before running any scheduling. The feature lives at `/constraints` and uses the existing empty `constraints/` feature folder.

## User Roles

- **ADMIN / SUPER_ADMIN**: Full CRUD on all constraints
- **ACADEMIC_COORDINATOR**: Read-only view

## Page Layout

Single scrollable page with three vertically stacked Card sections:

1. **Top: Hard Constraints** — Stable, ironclad rules
2. **Middle: Temporal Constraints** — Calendar-based, dynamic events
3. **Bottom: Institutional & Departmental Rules** — Department/University config cards

---

## Section 1: Hard Constraints Table

**Purpose:** Rules the algorithm can never break (e.g., "Max hours per day", "Min rest time").

**Data Model:** `IronConstraint` (name, description, isActive, createdAt, updatedAt)

**Table Columns:**
| Column | Type |
|--------|------|
| Rule Name | Text, bold |
| Description | Text, muted |
| Status | Toggle switch (on/off) |
| Actions | Edit (pencil icon), Delete (trash icon) |

**Behaviors:**
- Pre-seeded with common scheduling rules via database seed
- Toggle directly updates `isActive` via API (no dialog needed)
- Disabled rows shown at reduced opacity
- "+ Add Rule" button in card header opens Add dialog
- Edit/Delete icons in each row (admin only)
- Non-admin users see toggle and actions as disabled/hidden

**Add/Edit Dialog Fields:**
- Rule Name (required, text input)
- Description (required, textarea)

**Delete:** Confirmation AlertDialog before deletion.

---

## Section 2: Temporal Constraints Table

**Purpose:** Holidays, vacations, blackout dates that change each month/year.

**Data Model:** `DateConstraint` (name, description, startDate, endDate, isActive, createdAt, updatedAt)

**Table Columns:**
| Column | Type |
|--------|------|
| Event Name | Text, bold |
| Description | Text, muted |
| Start Date | Formatted date |
| End Date | Formatted date |
| Status | Toggle switch |
| Actions | Edit, Delete |

**Behaviors:**
- "+ Add Event" button in card header
- Toggle updates `isActive` inline
- Date display formatted per locale (EN: "Apr 12, 2026", HE: locale date)

**Add/Edit Dialog Fields:**
- Event Name (required, text)
- Description (required, textarea)
- Start Date (required, date picker)
- End Date (required, date picker, must be >= start date)

---

## Section 3: Institutional & Departmental Rules

**Purpose:** Configure department-level capacities and university semester dates.

**Layout:** Two side-by-side action cards within a single Card container:
- **Departments card** — icon, title, description, "Configure" button
- **University card** — icon, title, description, "Configure" button

### A. Department Configuration Dialog (Two-Step)

**Step 1: Select Department**
- Dropdown of all departments (from Department model)
- "Cancel" and "Continue" buttons
- Continue is disabled until a department is selected

**Step 2: Configure Department** (dialog content updates)
- Title shows department name (e.g., "Cardiology - Settings")
- Fields grouped in sections:

| Section | Fields |
|---------|--------|
| Capacity | Morning Capacity (number), Evening Capacity (number) |
| Electives | Elective Capacity (number) |
| Blocked Period | Start Date (optional, date), End Date (optional, date) |

- "Back" button returns to step 1
- "Save" button persists to DepartmentConstraint

**Data Model:** `DepartmentConstraint` (departmentId, morningCapacity, eveningCapacity, electiveCapacity, blockedStartDate, blockedEndDate)

### B. University Semester Dialog

- University dropdown (lists all universities)
- Semester Start date picker (required)
- Semester End date picker (required, must be > start)
- Year is auto-derived from the semester start date (extracted on the backend before insert)
- Save persists to `UniversitySemester`

**Data Model:** `UniversitySemester` (universityId, semesterStart, semesterEnd, year) — note: schema uses `semesterStart`/`semesterEnd` (not `startDate`/`endDate`), and `year` is required with a `@@unique([universityId, year])` constraint. Year is derived server-side from `semesterStart`.

---

## Technical Architecture

### Frontend (Client)

**Feature folder:** `client/src/features/constraints/`

```
constraints/
├── pages/
│   └── ConstraintsPage.tsx
├── components/
│   ├── HardConstraintsCard.tsx
│   ├── TemporalConstraintsCard.tsx
│   ├── InstitutionalRulesCard.tsx
│   ├── AddEditIronConstraintDialog.tsx
│   ├── AddEditDateConstraintDialog.tsx
│   ├── DeleteConstraintDialog.tsx
│   ├── DepartmentConfigDialog.tsx       (two-step)
│   └── UniversitySemesterDialog.tsx
├── hooks/
│   ├── useIronConstraints.ts
│   ├── useIronConstraintMutations.ts
│   ├── useDateConstraints.ts
│   ├── useDateConstraintMutations.ts
│   ├── useDepartments.ts
│   ├── useDepartmentConstraintMutations.ts
│   └── useUniversitySemesters.ts
├── api/
│   └── constraints.api.ts
├── types/
│   └── constraints.types.ts
├── schemas/
│   └── constraints.schema.ts
└── index.ts
```

**Patterns to follow:**
- `useTranslation('constraints')` for all text
- React Hook Form + Zod for all forms (factory schema pattern with `t`)
- TanStack React Query for data fetching/mutations
- Existing Shadcn components: Table, Card, Button, Input, Select, AlertDialog, Toggle
- Toast notifications via Sonner for success/error feedback
- `useIsAdmin()` hook for role-based UI

### Backend (Server)

All constraint-related routes are registered in a single `constraints` module. Department listing and university semester routes are also handled here since they serve the constraints UI.

**Module:** `server/src/modules/constraints/`

```
constraints/
├── constraints.routes.ts      (registers all routes below under /api/constraints)
├── constraints.controller.ts
├── constraints.service.ts
├── constraints.repository.ts
└── constraints.schema.ts
```

**API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/constraints/iron | List all iron constraints |
| POST | /api/constraints/iron | Create iron constraint |
| PATCH | /api/constraints/iron/:id | Update (including toggle) |
| DELETE | /api/constraints/iron/:id | Delete iron constraint |
| GET | /api/constraints/date | List all date constraints |
| POST | /api/constraints/date | Create date constraint |
| PATCH | /api/constraints/date/:id | Update date constraint |
| DELETE | /api/constraints/date/:id | Delete date constraint |
| GET | /api/constraints/departments | List all departments |
| GET | /api/constraints/departments/:id | Get department constraint |
| PUT | /api/constraints/departments/:id | Upsert department constraint |
| GET | /api/constraints/semesters/:universityId | Get university semesters |
| POST | /api/constraints/semesters | Create semester |
| PATCH | /api/constraints/semesters/:id | Update semester |

**Auth:** All endpoints require `authenticate` middleware. Write operations (POST/PATCH/DELETE/PUT) require admin role check.

> **Note:** `SoftConstraint` and `Holiday` models exist in the schema but are out of scope for this feature. `SoftConstraint` is for a future preferences system. `Holiday` is a separate concept from `DateConstraint` — holidays are recurring calendar events while date constraints are ad-hoc scheduling blocks.

### i18n

**New namespace:** `constraints`
**Files:** `locales/en/constraints.json`, `locales/he/constraints.json`

**Key structure:**
```json
{
  "page": { "title": "...", "subtitle": "..." },
  "hardConstraints": { "title": "...", "subtitle": "...", "addButton": "...", "columns": {...} },
  "temporalConstraints": { "title": "...", "subtitle": "...", "addButton": "...", "columns": {...} },
  "institutional": { "title": "...", "subtitle": "...", "departments": {...}, "university": {...} },
  "dialogs": { "addConstraint": {...}, "editConstraint": {...}, "delete": {...}, "department": {...}, "university": {...} },
  "validation": { "nameRequired": "...", "descriptionRequired": "...", "dateInvalid": "...", "endBeforeStart": "..." },
  "toast": { "created": "...", "updated": "...", "deleted": "...", "toggledOn": "...", "toggledOff": "..." }
}
```

### Database Seed

Add pre-seeded iron constraints to `server/prisma/seed.ts`:
- Maximum Hours Per Day
- Minimum Rest Time Between Shifts
- No Overlapping Assignments
- First Rotation Priority Rule
- Maximum Consecutive Days

---

## Routing

Add to `client/src/app/router.tsx`:
```
{ path: "constraints", element: <ConstraintsPage /> }
```

The route already exists as a planned route in the sidebar navigation.

---

## Verification Plan

1. **Backend:** Test each API endpoint with valid/invalid data using curl or API client
2. **Frontend:** Navigate to `/constraints`, verify all 3 sections render
3. **Hard Constraints:** Toggle a rule, add a new rule, edit, delete
4. **Temporal Constraints:** Add event with date range, toggle, edit, delete
5. **Department:** Click Configure → select department → fill form → save → verify persisted
6. **University:** Click Configure → select university → set dates → save → verify
7. **i18n:** Switch language to Hebrew, verify all text translates and RTL works
8. **Role check:** Log in as ACADEMIC_COORDINATOR, verify read-only (no add/edit/delete buttons)
