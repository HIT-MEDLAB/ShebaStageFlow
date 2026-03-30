import { startOfDay } from 'date-fns'
import type {
  Assignment,
  BlockReason,
  DepartmentConstraintData,
  IronConstraintData,
  UniversitySemesterData,
  ValidationResult,
  WeekDefinition,
} from '../types/scheduler.types'

export interface ValidationContext {
  blockedCells: Map<string, BlockReason>
  existingAssignments: Assignment[]
  departmentConstraints: DepartmentConstraintData[]
  ironConstraints: IronConstraintData[]
  weeks: WeekDefinition[]
  universityPriorities: Map<number, number>
  isAdmin: boolean
  universitySemesters?: UniversitySemesterData[]
  departmentNames?: Map<number, string>
}

/**
 * Determines the week number an assignment belongs to, based on its startDate.
 * Returns undefined if the assignment does not fall within any defined week.
 */
export function getAssignmentWeekNumber(
  assignment: Pick<Assignment, 'startDate'>,
  weeks: WeekDefinition[],
): number | undefined {
  const assignmentStart = startOfDay(new Date(assignment.startDate))
  const week = weeks.find(
    (w) => assignmentStart >= startOfDay(w.startDate) && assignmentStart <= startOfDay(w.endDate),
  )
  return week?.weekNumber
}

/**
 * Client-side validation for drag-and-drop moves.
 * Runs synchronously during drag operations to give immediate feedback.
 */
export function validateDrop(
  assignment: Assignment,
  targetDeptId: number,
  targetWeekNum: number,
  context: ValidationContext,
): ValidationResult {
  const cellKey = `dept:${targetDeptId}:week:${targetWeekNum}`

  // 1. Check department-specific date blocks
  if (context.blockedCells.has(cellKey)) {
    const reason = context.blockedCells.get(cellKey)!
    return {
      type: 'blocked',
      reasonKey: `grid.blocked.${reason.type}`,
      reasonParams: { name: reason.description },
    }
  }

  // 2. Check hospital-wide holiday blocks
  const holidayKey = `holiday:week:${targetWeekNum}`
  if (context.blockedCells.has(holidayKey)) {
    const reason = context.blockedCells.get(holidayKey)!
    return {
      type: 'blocked',
      reasonKey: 'grid.blocked.holiday',
      reasonParams: { name: reason.description },
    }
  }

  // 2.25. Date constraint blocks (global, like holidays)
  const dateConstraintKey = `dateConstraint:week:${targetWeekNum}`
  if (context.blockedCells.has(dateConstraintKey)) {
    const reason = context.blockedCells.get(dateConstraintKey)!
    return {
      type: 'blocked',
      reasonKey: 'grid.blocked.dateConstraint',
      reasonParams: { name: reason.constraintName ?? reason.description },
    }
  }

  // 2.5. Soft constraint checks (hard blocks — cells are disabled)
  const softDeptKey = `soft:dept:${targetDeptId}:week:${targetWeekNum}`
  const softGlobalKey = `soft:week:${targetWeekNum}`
  const softReason = context.blockedCells.get(softDeptKey) ?? context.blockedCells.get(softGlobalKey)
  if (softReason) {
    return {
      type: 'blocked',
      reasonKey: 'grid.blocked.softConstraint',
      reasonParams: { name: softReason.constraintName ?? softReason.description },
    }
  }

  // 3. Cross-department conflict: same university + yearInProgram + same shiftType + same week but different dept
  //    Skip for ELECTIVE assignments (they can be placed across departments freely)
  if (assignment.type !== 'ELECTIVE') {
    const crossDeptConflict = context.existingAssignments.find(
      (a) =>
        a.id !== assignment.id &&
        a.universityId === assignment.universityId &&
        a.yearInProgram === assignment.yearInProgram &&
        a.shiftType === assignment.shiftType &&
        a.departmentId !== targetDeptId &&
        getAssignmentWeekNumber(a, context.weeks) === targetWeekNum,
    )
    if (crossDeptConflict) {
      const incomingPriority =
        context.universityPriorities.get(assignment.universityId) ?? 0
      const displacedPriority =
        context.universityPriorities.get(crossDeptConflict.universityId) ?? 0
      return {
        type: 'conflict_replaceable',
        displacedAssignment: crossDeptConflict,
        incomingPriority,
        displacedPriority,
      }
    }
  }

  // Get all assignments in the target cell (excluding self)
  const cellAssignments = context.existingAssignments.filter(
    (a) =>
      a.departmentId === targetDeptId &&
      getAssignmentWeekNumber(a, context.weeks) === targetWeekNum &&
      a.id !== assignment.id,
  )

  const deptConstraint = context.departmentConstraints.find(
    (dc) => dc.departmentId === targetDeptId,
  )

  // 4. GROUP conflict with priority logic
  if (assignment.type === 'GROUP') {
    const sameShiftGroups = cellAssignments.filter(
      (a) => a.shiftType === assignment.shiftType && a.type === 'GROUP',
    )

    // shiftCapacity = max students the department can handle per shift (NOT group slots)
    const shiftCapacity = deptConstraint
      ? assignment.shiftType === 'MORNING'
        ? deptConstraint.morningCapacity
        : deptConstraint.eveningCapacity
      : null

    // 4a. Shift unavailable (capacity explicitly set to 0)
    if (shiftCapacity === 0) {
      return {
        type: 'blocked',
        reasonKey: 'grid.blocked.shiftUnavailable',
      }
    }

    // 4b. Group too big for department capacity
    if (
      shiftCapacity !== null &&
      assignment.studentCount !== null &&
      assignment.studentCount > shiftCapacity
    ) {
      if (context.isAdmin) {
        return {
          type: 'conflict_admin_override',
          reasonKey: 'grid.blocked.groupTooBig',
          reasonParams: {
            count: assignment.studentCount,
            capacity: shiftCapacity,
          },
        }
      }
      return {
        type: 'blocked',
        reasonKey: 'grid.blocked.groupTooBig',
        reasonParams: {
          count: assignment.studentCount,
          capacity: shiftCapacity,
        },
      }
    }

    // 4c. 1 group per department per shift per week (hardcoded business rule)
    if (sameShiftGroups.length > 0) {
      const existingGroup = sameShiftGroups[0]
      const incomingPriority =
        context.universityPriorities.get(assignment.universityId) ?? 0
      const existingPriority =
        context.universityPriorities.get(existingGroup.universityId) ?? 0

      if (incomingPriority > existingPriority) {
        return {
          type: 'conflict_replaceable',
          displacedAssignment: existingGroup,
          incomingPriority,
          displacedPriority: existingPriority,
        }
      }

      if (incomingPriority === existingPriority) {
        if (context.isAdmin) {
          return {
            type: 'conflict_admin_override',
            reasonKey: 'grid.blocked.samePriority',
          }
        }
        return {
          type: 'conflict_same_priority',
          existingAssignment: existingGroup,
          reasonKey: 'grid.blocked.samePriority',
        }
      }

      if (context.isAdmin) {
        return {
          type: 'conflict_admin_override',
          reasonKey: 'grid.blocked.lowerPriority',
        }
      }
      return {
        type: 'blocked',
        reasonKey: 'grid.blocked.lowerPriority',
      }
    }
  }

  // 5. ELECTIVE capacity
  if (assignment.type === 'ELECTIVE' && deptConstraint) {
    const electivesInWeek = cellAssignments.filter(
      (a) => a.type === 'ELECTIVE',
    ).length
    if (electivesInWeek >= deptConstraint.electiveCapacity) {
      if (context.isAdmin) {
        return {
          type: 'conflict_admin_override',
          reasonKey: 'grid.blocked.electiveCapacityFull',
        }
      }
      return {
        type: 'blocked',
        reasonKey: 'grid.blocked.electiveCapacityFull',
      }
    }
  }

  // 6. Iron constraints (dynamic from DB)
  const targetWeek = context.weeks.find((w) => w.weekNumber === targetWeekNum)

  for (const ic of context.ironConstraints) {
    if (!ic.isActive) continue

    // SEMESTER_BOUNDARY: assignment dates must fall within university semester
    if (ic.name === 'SEMESTER_BOUNDARY' && targetWeek && context.universitySemesters) {
      const semester = context.universitySemesters.find(
        (s) => s.universityId === assignment.universityId,
      )
      if (semester) {
        const semStart = new Date(semester.semesterStart)
        const semEnd = new Date(semester.semesterEnd)
        if (targetWeek.startDate < semStart || targetWeek.endDate > semEnd) {
          return {
            type: 'blocked',
            reasonKey: 'grid.blocked.semesterBoundary',
          }
        }
      }
    }

    // FIRST_CLINICAL_ROTATION: year-1 students should go to Internal Medicine or Pediatrics
    if (ic.name === 'FIRST_CLINICAL_ROTATION' && assignment.yearInProgram === 1) {
      const deptName = context.departmentNames?.get(targetDeptId) ?? ''
      const allowedDepts = ['רפואה פנימית', 'ילדים']
      if (deptName && !allowedDepts.includes(deptName)) {
        return {
          type: 'warning',
          reasonKey: 'grid.warning.firstClinicalRotation',
          reasonParams: { departmentName: deptName },
        }
      }
    }
  }

  return { type: 'valid' }
}
