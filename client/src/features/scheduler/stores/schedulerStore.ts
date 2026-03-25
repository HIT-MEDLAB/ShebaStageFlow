import { create } from 'zustand'

interface SchedulerStore {
  academicYearId: number | null
  selectedUniversities: number[]
  selectedShift: 'all' | 'morning' | 'evening'
  selectedYear: number | null
  activeDialog: null | 'create' | 'import' | 'edit'
  editingAssignmentId: number | null
  activeDragId: number | null

  setAcademicYear: (yearId: number) => void
  setUniversityFilter: (ids: number[]) => void
  setShiftFilter: (shift: 'all' | 'morning' | 'evening') => void
  setYearFilter: (year: number | null) => void
  openDialog: (type: 'create' | 'import' | 'edit', assignmentId?: number) => void
  closeDialog: () => void
  setActiveDragId: (id: number | null) => void
}

export const useSchedulerStore = create<SchedulerStore>((set) => ({
  academicYearId: null,
  selectedUniversities: [],
  selectedShift: 'all',
  selectedYear: null,
  activeDialog: null,
  editingAssignmentId: null,
  activeDragId: null,

  setAcademicYear: (yearId) => set({ academicYearId: yearId }),
  setUniversityFilter: (ids) => set({ selectedUniversities: ids }),
  setShiftFilter: (shift) => set({ selectedShift: shift }),
  setYearFilter: (year) => set({ selectedYear: year }),
  openDialog: (type, assignmentId) =>
    set({ activeDialog: type, editingAssignmentId: assignmentId ?? null }),
  closeDialog: () => set({ activeDialog: null, editingAssignmentId: null }),
  setActiveDragId: (id) => set({ activeDragId: id }),
}))
