import { useTranslation } from 'react-i18next'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { useSchedulerStore } from '../stores/schedulerStore'
import { useAcademicYears } from '../hooks/useAcademicYears'
import { useDepartments } from '../hooks/useDepartments'
import { useAssignments } from '../hooks/useAssignments'
import { useConstraints } from '../hooks/useConstraints'
import { useAcademicYearWeeks } from '../hooks/useAcademicYearWeeks'
import { useGridData } from '../hooks/useGridData'
import { useBlockedCells } from '../hooks/useBlockedCells'
import { useMoveAssignment } from '../hooks/useMoveAssignment'
import { validateDrop } from '../validators/assignmentValidator'
import { SchedulerGrid } from '../components/grid/SchedulerGrid'
import { GridDragOverlay } from '../components/grid/GridDragOverlay'
import { SchedulerToolbar } from '../components/SchedulerToolbar'
import { SchedulerFilters } from '../components/SchedulerFilters'
import { AssignmentLegend } from '../components/AssignmentLegend'
import type { Assignment } from '../types/scheduler.types'

export default function SchedulerPage() {
  const { t } = useTranslation('scheduler')
  const {
    academicYearId,
    selectedUniversities,
    selectedShift,
    selectedYear,
    activeDragId,
    setActiveDragId,
  } = useSchedulerStore()

  const { data: academicYears } = useAcademicYears()
  const currentYear = academicYears?.find((y) => y.id === academicYearId)
  const { data: departments } = useDepartments()
  const { data: assignments } = useAssignments(academicYearId, {
    selectedUniversities,
    selectedShift,
    selectedYear,
  })
  const { data: constraints } = useConstraints(
    currentYear ? new Date(currentYear.startDate).getFullYear() : null,
  )
  const weeks = useAcademicYearWeeks(currentYear)
  const gridData = useGridData(assignments, weeks, {
    selectedUniversities,
    selectedShift,
    selectedYear,
  })
  const blockedCells = useBlockedCells(constraints, weeks)
  const moveMutation = useMoveAssignment()

  // Find the currently dragged assignment for the drag overlay
  const draggedAssignment = activeDragId
    ? assignments?.find((a) => a.id === activeDragId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as number)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || !assignments || !constraints) return

    const assignment = active.data.current?.assignment as Assignment
    const { departmentId, weekNumber } = over.data.current as {
      departmentId: number
      weekNumber: number
    }

    // Skip if dropped in same position
    if (assignment.departmentId === departmentId) {
      const currentWeek = weeks.find((w) => {
        const aStart = new Date(assignment.startDate)
        return aStart >= w.startDate && aStart <= w.endDate
      })
      if (currentWeek?.weekNumber === weekNumber) return
    }

    // Validate the drop
    const result = validateDrop(assignment, departmentId, weekNumber, {
      blockedCells,
      existingAssignments: assignments,
      departmentConstraints: constraints.departmentConstraints,
      ironConstraints: constraints.ironConstraints,
      weeks,
    })

    if (!result.valid) {
      toast.error(t(result.reasonKey, result.reasonParams))
      return
    }

    // Find the target week to get the actual dates
    const targetWeek = weeks.find((w) => w.weekNumber === weekNumber)
    if (!targetWeek) return

    moveMutation.mutate({
      id: assignment.id,
      data: {
        departmentId,
        startDate: targetWeek.startDate.toISOString(),
        endDate: targetWeek.endDate.toISOString(),
        shiftType: assignment.shiftType,
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <SchedulerToolbar />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SchedulerFilters />
        <AssignmentLegend />
      </div>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SchedulerGrid
          departments={departments ?? []}
          weeks={weeks}
          gridData={gridData}
          blockedCells={blockedCells}
        />
        <DragOverlay>
          {draggedAssignment ? (
            <GridDragOverlay assignment={draggedAssignment} />
          ) : null}
        </DragOverlay>
      </DndContext>
      {/* Dialogs will be added in Tasks 12-14 */}
    </div>
  )
}
