import { create } from 'zustand'
import type { Assignment, WeekDefinition } from '../types/scheduler.types'

interface SchedulerStore {
  academicYearId: number | null
  selectedUniversities: number[]
  selectedShift: 'all' | 'morning' | 'evening'
  selectedYear: number | null
  activeDialog:
    | null
    | 'create'
    | 'import'
    | 'smartImport'
    | 'edit'
    | 'replacement'
    | 'adminOverride'
    | 'warningConfirm'
  editingAssignmentId: number | null
  activeDragId: number | null

  // Constraint integration state
  pendingMove: {
    assignment: Assignment
    targetDeptId: number
    targetWeekNum: number
  } | null
  displacedAssignment: Assignment | null
  replacementSuggestedWeeks: WeekDefinition[] | null
  adminOverrideReason: {
    reasonKey: string
    reasonParams?: Record<string, string>
  } | null
  warningReason: {
    reasonKey: string
    reasonParams?: Record<string, string>
  } | null

  setAcademicYear: (yearId: number) => void
  setUniversityFilter: (ids: number[]) => void
  setShiftFilter: (shift: 'all' | 'morning' | 'evening') => void
  setYearFilter: (year: number | null) => void
  openDialog: (
    type: 'create' | 'import' | 'smartImport' | 'edit',
    assignmentId?: number,
  ) => void
  closeDialog: () => void
  setActiveDragId: (id: number | null) => void

  openReplacementDialog: (
    pendingMove: SchedulerStore['pendingMove'],
    displacedAssignment: Assignment,
    suggestedWeeks: WeekDefinition[],
  ) => void
  openAdminOverrideDialog: (
    pendingMove: SchedulerStore['pendingMove'],
    reasonKey: string,
    reasonParams?: Record<string, string>,
  ) => void
  openWarningConfirmDialog: (
    pendingMove: SchedulerStore['pendingMove'],
    reasonKey: string,
    reasonParams?: Record<string, string>,
  ) => void
  clearPendingMove: () => void
}

export const useSchedulerStore = create<SchedulerStore>((set) => ({
  academicYearId: null,
  selectedUniversities: [],
  selectedShift: 'all',
  selectedYear: null,
  activeDialog: null,
  editingAssignmentId: null,
  activeDragId: null,

  pendingMove: null,
  displacedAssignment: null,
  replacementSuggestedWeeks: null,
  adminOverrideReason: null,
  warningReason: null,

  setAcademicYear: (yearId) => set({ academicYearId: yearId }),
  setUniversityFilter: (ids) => set({ selectedUniversities: ids }),
  setShiftFilter: (shift) => set({ selectedShift: shift }),
  setYearFilter: (year) => set({ selectedYear: year }),
  openDialog: (type, assignmentId) =>
    set({ activeDialog: type, editingAssignmentId: assignmentId ?? null }),
  closeDialog: () =>
    set({
      activeDialog: null,
      editingAssignmentId: null,
      pendingMove: null,
      displacedAssignment: null,
      replacementSuggestedWeeks: null,
      adminOverrideReason: null,
      warningReason: null,
    }),
  setActiveDragId: (id) => set({ activeDragId: id }),

  openReplacementDialog: (pendingMove, displacedAssignment, suggestedWeeks) =>
    set({
      activeDialog: 'replacement',
      pendingMove,
      displacedAssignment,
      replacementSuggestedWeeks: suggestedWeeks,
    }),

  openAdminOverrideDialog: (pendingMove, reasonKey, reasonParams) =>
    set({
      activeDialog: 'adminOverride',
      pendingMove,
      adminOverrideReason: { reasonKey, reasonParams },
    }),

  openWarningConfirmDialog: (pendingMove, reasonKey, reasonParams) =>
    set({
      activeDialog: 'warningConfirm',
      pendingMove,
      warningReason: { reasonKey, reasonParams },
    }),

  clearPendingMove: () =>
    set({
      activeDialog: null,
      pendingMove: null,
      displacedAssignment: null,
      replacementSuggestedWeeks: null,
      adminOverrideReason: null,
      warningReason: null,
    }),
}))
