import { useMemo } from 'react'

import { useIsAdmin } from '@/hooks/useIsAdmin'

import type { AcademicYear, University, Department } from '../types/scheduler.types'
import type { ValidationContext } from '../validators/assignmentValidator'
import { useSchedulerStore } from '../stores/schedulerStore'
import { useAcademicYears } from './useAcademicYears'
import { useAcademicYearWeeks } from './useAcademicYearWeeks'
import { useDepartments } from './useDepartments'
import { useUniversities } from './useUniversities'
import { useAssignments } from './useAssignments'
import { useConstraints } from './useConstraints'
import { useBlockedCells } from './useBlockedCells'

export interface ValidationContextResult {
  context: ValidationContext | null
  weeks: ReturnType<typeof useAcademicYearWeeks>
  currentYear: AcademicYear | undefined
  universities: University[] | undefined
  departments: Department[] | undefined
}

/**
 * Assembles the {@link ValidationContext} used by client-side assignment
 * validation. Centralizes the query wiring previously inlined in the scheduler
 * dialogs so create/edit flows validate against the same data the grid does.
 *
 * Returns `context: null` until both assignments and constraints have loaded.
 */
export function useValidationContext(): ValidationContextResult {
  const { academicYearId, selectedUniversities, selectedShift, selectedYear } =
    useSchedulerStore()
  const isAdmin = useIsAdmin()

  const { data: academicYears } = useAcademicYears()
  const currentYear = academicYears?.find((y) => y.id === academicYearId)

  const { data: departments } = useDepartments(academicYearId)
  const { data: universities } = useUniversities()
  const { data: assignments } = useAssignments(academicYearId, {
    selectedUniversities,
    selectedShift,
    selectedYear,
  })

  const constraintYears = currentYear
    ? [...new Set([
        new Date(currentYear.startDate).getFullYear(),
        new Date(currentYear.endDate).getFullYear(),
      ])]
    : null
  const { data: constraints } = useConstraints(constraintYears, academicYearId ?? undefined)
  const weeks = useAcademicYearWeeks(currentYear)
  const blockedCells = useBlockedCells(constraints, weeks)

  const universityPriorities = useMemo(
    () => new Map((universities ?? []).map((u) => [u.id, u.priority])),
    [universities],
  )

  const departmentNames = useMemo(
    () => new Map((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  )

  const context: ValidationContext | null =
    assignments && constraints
      ? {
          blockedCells,
          existingAssignments: assignments,
          departmentConstraints: constraints.departmentConstraints,
          ironConstraints: constraints.ironConstraints,
          weeks,
          universityPriorities,
          isAdmin,
          universitySemesters: constraints.universitySemesters,
          departmentNames,
        }
      : null

  return { context, weeks, currentYear, universities, departments }
}
