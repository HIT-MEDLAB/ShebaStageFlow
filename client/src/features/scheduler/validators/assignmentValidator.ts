import type {
  Assignment,
  BlockReason,
  DepartmentConstraintData,
  IronConstraintData,
  WeekDefinition,
} from '../types/scheduler.types'

export type ValidationResult =
  | { valid: true }
  | { valid: false; reasonKey: string; reasonParams?: Record<string, string> }

interface ValidationContext {
  blockedCells: Map<string, BlockReason>
  existingAssignments: Assignment[]
  departmentConstraints: DepartmentConstraintData[]
  ironConstraints: IronConstraintData[]
  weeks: WeekDefinition[]
}

/**
 * Determines the week number an assignment belongs to, based on its startDate.
 * Returns undefined if the assignment does not fall within any defined week.
 */
function getAssignmentWeekNumber(
  assignment: Assignment,
  weeks: WeekDefinition[],
): number | undefined {
  const assignmentStart = new Date(assignment.startDate)
  const week = weeks.find(
    (w) => assignmentStart >= w.startDate && assignmentStart <= w.endDate,
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
      valid: false,
      reasonKey: `grid.blocked.${reason.type}`,
      reasonParams: { name: reason.description },
    }
  }

  // 2. Check hospital-wide holiday blocks
  const holidayKey = `holiday:week:${targetWeekNum}`
  if (context.blockedCells.has(holidayKey)) {
    const reason = context.blockedCells.get(holidayKey)!
    return {
      valid: false,
      reasonKey: 'grid.blocked.holiday',
      reasonParams: { name: reason.description },
    }
  }

  // 3. Check capacity limits
  const cellAssignments = context.existingAssignments.filter(
    (a) =>
      a.departmentId === targetDeptId &&
      getAssignmentWeekNumber(a, context.weeks) === targetWeekNum &&
      a.id !== assignment.id, // exclude the assignment being moved
  )

  const deptConstraint = context.departmentConstraints.find(
    (dc) => dc.departmentId === targetDeptId,
  )
  if (deptConstraint && assignment.type === 'GROUP') {
    const sameShiftGroups = cellAssignments.filter(
      (a) => a.shiftType === assignment.shiftType && a.type === 'GROUP',
    ).length
    const capacity =
      assignment.shiftType === 'MORNING'
        ? deptConstraint.morningCapacity
        : deptConstraint.eveningCapacity
    if (sameShiftGroups >= capacity) {
      return { valid: false, reasonKey: 'grid.blocked.capacityFull' }
    }
  }

  // 4. Check iron constraints (dynamic from DB)
  // Iron constraints are dynamic DB rules. The validator checks known patterns
  // by matching constraint names to validation functions.
  for (const ic of context.ironConstraints) {
    if (!ic.isActive) continue
    // Future: map ic.name to specific validation logic as constraint types are defined.
    // For now, active iron constraints are acknowledged but no client-side rules are applied.
    void ic
  }

  return { valid: true }
}
