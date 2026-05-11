import * as XLSX from 'xlsx'
import type { ExportAssignment } from '../types/scheduler.types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function mapType(type: string): string {
  return type === 'GROUP' ? 'קבוצה' : 'אלקטיב'
}

function mapShift(shift: string): string {
  return shift === 'MORNING' ? 'בוקר' : 'ערב'
}

export function exportSchedulerToExcel(assignments: ExportAssignment[]) {
  const wb = XLSX.utils.book_new()

  // Build groupId → week count map for block size calculation
  const groupWeekCount = new Map<string, number>()
  for (const a of assignments) {
    if (a.groupId) {
      groupWeekCount.set(a.groupId, (groupWeekCount.get(a.groupId) ?? 0) + 1)
    }
  }

  // Build groupId → overall date range (first slot start, last slot end)
  const groupDateRange = new Map<string, { startDate: string; endDate: string }>()
  for (const a of assignments) {
    if (a.groupId) {
      const existing = groupDateRange.get(a.groupId)
      if (!existing) {
        groupDateRange.set(a.groupId, { startDate: a.startDate, endDate: a.endDate })
      } else {
        if (new Date(a.startDate) < new Date(existing.startDate)) existing.startDate = a.startDate
        if (new Date(a.endDate) > new Date(existing.endDate)) existing.endDate = a.endDate
      }
    }
  }

  // Sheet 1: שיבוצים (Assignments)
  const assignmentRows = assignments.map((a) => ({
    'מחלקה': a.department.name,
    'מוסד אקדמי': a.university.name,
    'תאריך התחלה': formatDate(a.groupId ? groupDateRange.get(a.groupId)!.startDate : a.startDate),
    'תאריך סיום': formatDate(a.groupId ? groupDateRange.get(a.groupId)!.endDate : a.endDate),
    'כמות שבועות': a.groupId ? (groupWeekCount.get(a.groupId) ?? 1) : 1,
    'מספר סטודנטים': a.studentCount ?? '',
    'שנת לימוד': a.yearInProgram,
    'סוג שיבוץ': mapType(a.type),
    'שם מדריך': a.tutorName ?? '',
    'משמרת': mapShift(a.shiftType),
  }))

  const ws1 = XLSX.utils.json_to_sheet(assignmentRows)
  XLSX.utils.book_append_sheet(wb, ws1, 'שיבוצים')

  // Sheet 2: סטודנטים (Students)
  const studentRows: Record<string, unknown>[] = []
  for (const a of assignments) {
    for (const link of a.students) {
      const s = link.student
      studentRows.push({
        'שם פרטי': s.firstName,
        'שם משפחה': s.lastName,
        'תעודת זהות': s.nationalId,
        'טלפון': s.phone ?? '',
        'אימייל': s.email ?? '',
        'מוסד אקדמי': a.university.name,
        'מחלקה': a.department.name,
        'תאריך התחלה': formatDate(a.groupId ? groupDateRange.get(a.groupId)!.startDate : a.startDate),
        'תאריך סיום': formatDate(a.groupId ? groupDateRange.get(a.groupId)!.endDate : a.endDate),
        'משמרת': mapShift(a.shiftType),
      })
    }
  }

  const ws2 = XLSX.utils.json_to_sheet(studentRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'סטודנטים')

  XLSX.writeFile(wb, 'scheduler-export.xlsx')
}
