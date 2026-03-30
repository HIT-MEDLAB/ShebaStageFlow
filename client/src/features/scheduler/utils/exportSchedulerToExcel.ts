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

  // Sheet 1: שיבוצים (Assignments)
  const assignmentRows = assignments.map((a) => ({
    'מחלקה': a.department.name,
    'מוסד אקדמי': a.university.name,
    'תאריך התחלה': formatDate(a.startDate),
    'תאריך סיום': formatDate(a.endDate),
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
        'תאריך התחלה': formatDate(a.startDate),
        'תאריך סיום': formatDate(a.endDate),
        'משמרת': mapShift(a.shiftType),
      })
    }
  }

  const ws2 = XLSX.utils.json_to_sheet(studentRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'סטודנטים')

  XLSX.writeFile(wb, 'scheduler-export.xlsx')
}
