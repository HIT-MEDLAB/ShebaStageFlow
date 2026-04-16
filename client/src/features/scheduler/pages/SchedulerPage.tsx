import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
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
import { useBlockGroups } from '../hooks/useBlockGroups'
import { useMoveBlock } from '../hooks/useBlockActions'
import { useDisplaceAssignment } from '../hooks/useDisplaceAssignment'
import { useUniversities } from '../hooks/useUniversities'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { validateDrop } from '../validators/assignmentValidator'
import type { ValidationContext } from '../validators/assignmentValidator'
import { findAvailableWeeks, findAvailableBlockWeeks } from '../validators/findAvailableWeeks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SchedulerGrid } from '../components/grid/SchedulerGrid'
import { GridDragOverlay } from '../components/grid/GridDragOverlay'
import { SchedulerToolbar } from '../components/SchedulerToolbar'
import { SchedulerFilters } from '../components/SchedulerFilters'
import { AssignmentLegend } from '../components/AssignmentLegend'
import { ManualAssignmentDialog } from '../components/dialogs/ManualAssignmentDialog'
import { ExcelImportDialog } from '../components/dialogs/ExcelImportDialog'
import { SmartImportWizard } from '../components/dialogs/SmartImportWizard'
import { EditAssignmentDialog } from '../components/dialogs/EditAssignmentDialog'
import { ReplacementDialog } from '../components/dialogs/ReplacementDialog'
import { AdminOverrideDialog } from '../components/dialogs/AdminOverrideDialog'
import { WarningConfirmDialog } from '../components/dialogs/WarningConfirmDialog'
import { ApprovalTab } from '../components/approval/ApprovalTab'
import { format } from 'date-fns'
import type { Assignment, WeekDefinition } from '../types/scheduler.types'

export default function SchedulerPage() {
  const { t } = useTranslation('scheduler')
  const {
    academicYearId,
    selectedUniversities,
    selectedShift,
    selectedYear,
    departmentNameFilter,
    activeDialog,
    activeDragId,
    setActiveDragId,
    pendingMove,
    displacedAssignment,
    displacedBlock,
    replacementSuggestedWeeks,
    adminOverrideReason,
    warningReason,
    openReplacementDialog,
    openAdminOverrideDialog,
    openWarningConfirmDialog,
    clearPendingMove,
  } = useSchedulerStore()

  const isAdmin = useIsAdmin()
  const { data: academicYears } = useAcademicYears()
  const currentYear = academicYears?.find((y) => y.id === academicYearId)
  const { data: departments } = useDepartments()
  const filteredDepartments = useMemo(() => {
    const list = departments ?? []
    const q = departmentNameFilter.trim().toLowerCase()
    if (!q) return list
    return list.filter((d) => d.name.toLowerCase().includes(q))
  }, [departments, departmentNameFilter])
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
  const { data: constraints } = useConstraints(constraintYears)
  const { data: universities } = useUniversities()
  const weeks = useAcademicYearWeeks(currentYear)
  const gridData = useGridData(assignments, weeks, {
    selectedUniversities,
    selectedShift,
    selectedYear,
  })
  const blockedCells = useBlockedCells(constraints, weeks)
  const blockGroups = useBlockGroups(assignments)
  const moveMutation = useMoveAssignment()
  const moveBlockMutation = useMoveBlock()
  const displaceMutation = useDisplaceAssignment()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // Build university priorities map
  const universityPriorities = useMemo(
    () => new Map((universities ?? []).map((u) => [u.id, u.priority])),
    [universities],
  )

  // Build department names map
  const departmentNames = useMemo(
    () => new Map((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  )

  // Build validation context (reused by drag-drop + dialogs)
  const validationContext: ValidationContext | null =
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

  // Find the currently dragged assignment for the drag overlay
  const draggedAssignment = activeDragId
    ? assignments?.find((a) => a.id === activeDragId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as number)
  }

  function executeMoveAssignment(
    assignment: Assignment,
    targetDeptId: number,
    targetWeekNum: number,
    forceOverride?: boolean,
  ) {
    const targetWeek = weeks.find((w) => w.weekNumber === targetWeekNum)
    if (!targetWeek) return

    moveMutation.mutate({
      id: assignment.id,
      data: {
        departmentId: targetDeptId,
        startDate: format(targetWeek.startDate, 'yyyy-MM-dd'),
        endDate: format(targetWeek.endDate, 'yyyy-MM-dd'),
        ...(forceOverride && { forceOverride: true }),
      },
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || !validationContext) return

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

    // Block-aware drag: if assignment is part of a block, move the entire block
    if (assignment.groupId) {
      const block = blockGroups.get(assignment.groupId)
      if (block && block.length > 1) {
        const targetWeek = weeks.find((w) => w.weekNumber === weekNumber)
        if (!targetWeek) return

        // Calculate the offset: which week in the block was dragged
        const draggedIndex = assignment.groupIndex ?? 0
        // First week of block at the target position
        const firstWeekNum = weekNumber - draggedIndex
        const firstWeek = weeks.find((w) => w.weekNumber === firstWeekNum)
        if (!firstWeek) {
          toast.error(t('grid.blocked.noSpace'))
          return
        }

        moveBlockMutation.mutate({
          groupId: assignment.groupId,
          data: {
            departmentId,
            startDate: format(firstWeek.startDate, 'yyyy-MM-dd'),
          },
        })
        return
      }
    }

    const result = validateDrop(assignment, departmentId, weekNumber, validationContext)

    switch (result.type) {
      case 'valid':
        executeMoveAssignment(assignment, departmentId, weekNumber)
        break

      case 'blocked':
        toast.error(t(result.reasonKey, result.reasonParams))
        break

      case 'warning':
        openWarningConfirmDialog(
          { assignment, targetDeptId: departmentId, targetWeekNum: weekNumber },
          result.reasonKey,
          result.reasonParams,
        )
        break

      case 'conflict_replaceable': {
        // Check if the displaced assignment is part of a block
        const displacedGroupId = result.displacedAssignment.groupId
        const displacedBlockMembers = displacedGroupId
          ? blockGroups.get(displacedGroupId)
          : undefined

        if (displacedBlockMembers && displacedBlockMembers.length > 1) {
          // Block displacement — find contiguous N-week windows
          const suggestedWeeks = findAvailableBlockWeeks(
            displacedBlockMembers,
            weekNumber,
            validationContext,
          )
          openReplacementDialog(
            { assignment, targetDeptId: departmentId, targetWeekNum: weekNumber },
            result.displacedAssignment,
            suggestedWeeks,
            displacedBlockMembers,
          )
        } else {
          // Single assignment displacement
          const suggestedWeeks = findAvailableWeeks(
            result.displacedAssignment,
            weekNumber,
            validationContext,
          )
          openReplacementDialog(
            { assignment, targetDeptId: departmentId, targetWeekNum: weekNumber },
            result.displacedAssignment,
            suggestedWeeks,
          )
        }
        break
      }

      case 'conflict_same_priority':
        if (isAdmin) {
          openAdminOverrideDialog(
            { assignment, targetDeptId: departmentId, targetWeekNum: weekNumber },
            result.reasonKey,
          )
        } else {
          toast.error(t(result.reasonKey))
        }
        break

      case 'conflict_admin_override':
        if (isAdmin) {
          openAdminOverrideDialog(
            { assignment, targetDeptId: departmentId, targetWeekNum: weekNumber },
            result.reasonKey,
            result.reasonParams,
          )
        } else {
          toast.error(t(result.reasonKey, result.reasonParams))
        }
        break
    }
  }

  function handleReplacementConfirm(targetWeek: WeekDefinition) {
    if (!pendingMove || !displacedAssignment) return

    const incomingTargetWeek = weeks.find((w) => w.weekNumber === pendingMove.targetWeekNum)
    if (!incomingTargetWeek) return

    // Block displacement: move the entire displaced block to a contiguous window
    if (displacedBlock && displacedBlock.length > 1 && displacedAssignment.groupId) {
      // targetWeek is the first week of the window where the block should go
      // First: move the displaced block to the new position
      moveBlockMutation.mutate(
        {
          groupId: displacedAssignment.groupId,
          data: {
            departmentId: displacedAssignment.departmentId,
            startDate: format(targetWeek.startDate, 'yyyy-MM-dd'),
          },
        },
        {
          onSuccess: () => {
            // Then: move the incoming assignment to its target
            moveMutation.mutate({
              id: pendingMove.assignment.id,
              data: {
                departmentId: pendingMove.targetDeptId,
                startDate: format(incomingTargetWeek.startDate, 'yyyy-MM-dd'),
                endDate: format(incomingTargetWeek.endDate, 'yyyy-MM-dd'),
              },
            })
          },
        },
      )
      clearPendingMove()
      return
    }

    // Single assignment displacement
    displaceMutation.mutate({
      id: pendingMove.assignment.id,
      data: {
        departmentId: pendingMove.targetDeptId,
        startDate: format(incomingTargetWeek.startDate, 'yyyy-MM-dd'),
        endDate: format(incomingTargetWeek.endDate, 'yyyy-MM-dd'),
        displacedAssignmentId: displacedAssignment.id,
        displacedDepartmentId: displacedAssignment.departmentId,
        displacedStartDate: format(targetWeek.startDate, 'yyyy-MM-dd'),
        displacedEndDate: format(targetWeek.endDate, 'yyyy-MM-dd'),
      },
    })

    clearPendingMove()
  }

  function handleWarningConfirm() {
    if (!pendingMove) return

    const targetWeek = weeks.find((w) => w.weekNumber === pendingMove.targetWeekNum)
    if (!targetWeek) return

    moveMutation.mutate({
      id: pendingMove.assignment.id,
      data: {
        departmentId: pendingMove.targetDeptId,
        startDate: format(targetWeek.startDate, 'yyyy-MM-dd'),
        endDate: format(targetWeek.endDate, 'yyyy-MM-dd'),
        forceOverride: true,
      },
    })

    clearPendingMove()
  }

  function handleAdminOverrideConfirm() {
    if (!pendingMove) return

    executeMoveAssignment(
      pendingMove.assignment,
      pendingMove.targetDeptId,
      pendingMove.targetWeekNum,
      true,
    )

    toast.success(t('toast.overrideSuccess'))
    clearPendingMove()
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 h-full overflow-hidden">
      <h1 className="text-2xl font-bold shrink-0">{t('title')}</h1>
      <Tabs defaultValue="scheduler" className="flex flex-col flex-1 min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="scheduler">{t('title')}</TabsTrigger>
          {isAdmin && <TabsTrigger value="approvals">{t('approval.tab')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="scheduler" className="flex flex-col gap-4 flex-1 min-h-0">
          <SchedulerToolbar />
          <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
            <SchedulerFilters />
            <AssignmentLegend />
          </div>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SchedulerGrid
              departments={filteredDepartments}
              weeks={weeks}
              gridData={gridData}
              blockedCells={blockedCells}
              blockGroups={blockGroups}
            />
            <DragOverlay>
              {draggedAssignment ? (
                <GridDragOverlay assignment={draggedAssignment} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="approvals" className="flex-1 min-h-0 overflow-auto">
            <ApprovalTab />
          </TabsContent>
        )}
      </Tabs>

      {activeDialog === 'create' && <ManualAssignmentDialog />}
      {activeDialog === 'import' && <ExcelImportDialog />}
      {activeDialog === 'smartImport' && <SmartImportWizard />}
      {activeDialog === 'edit' && <EditAssignmentDialog />}
      {activeDialog === 'replacement' && displacedAssignment && replacementSuggestedWeeks && (
        <ReplacementDialog
          open
          displacedAssignment={displacedAssignment}
          displacedBlock={displacedBlock}
          suggestedWeeks={replacementSuggestedWeeks}
          allWeeks={weeks}
          onReplace={handleReplacementConfirm}
          onCancel={clearPendingMove}
        />
      )}
      {activeDialog === 'adminOverride' && adminOverrideReason && (
        <AdminOverrideDialog
          open
          reasonKey={adminOverrideReason.reasonKey}
          reasonParams={adminOverrideReason.reasonParams}
          onConfirm={handleAdminOverrideConfirm}
          onCancel={clearPendingMove}
        />
      )}
      {activeDialog === 'warningConfirm' && warningReason && (
        <WarningConfirmDialog
          open
          reasonKey={warningReason.reasonKey}
          reasonParams={warningReason.reasonParams}
          onConfirm={handleWarningConfirm}
          onCancel={clearPendingMove}
        />
      )}
    </div>
  )
}
