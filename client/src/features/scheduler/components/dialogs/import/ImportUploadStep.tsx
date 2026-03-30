import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { AlertCircle } from 'lucide-react'

import { ExcelDropZone } from '../ExcelDropZone'
import type { SmartImportRow } from '../../../types/scheduler.types'

const EXPECTED_COLUMNS_HE = [
  'מחלקה',
  'מוסד אקדמי',
  'תאריך התחלה',
  'תאריך סיום',
  'מספר סטודנטים',
  'שנת לימוד',
  'סוג שיבוץ',
  'שם מדריך',
  'משמרת',
] as const

const HE_TO_KEY_MAP: Record<string, keyof SmartImportRow> = {
  'מחלקה': 'departmentName',
  'מוסד אקדמי': 'universityName',
  'תאריך התחלה': 'startDate',
  'תאריך סיום': 'endDate',
  'מספר סטודנטים': 'studentCount',
  'שנת לימוד': 'yearInProgram',
  'סוג שיבוץ': 'placementType',
  'שם מדריך': 'tutorName',
  'משמרת': 'shiftType',
}

const HEBREW_YEAR_MAP: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6,
}

function parseYearInProgram(value: unknown): number {
  if (typeof value === 'number') return value
  const str = String(value ?? '').trim()
  // Match Hebrew letter (possibly followed by ׳ or ')
  const match = str.match(/([אבגדהו])/)
  if (match) {
    return HEBREW_YEAR_MAP[match[1]] ?? 1
  }
  const parsed = parseInt(str, 10)
  return isNaN(parsed) ? 1 : parsed
}

function excelDateToISO(value: unknown): string {
  if (typeof value === 'number') {
    // Excel serial date number — use UTC to avoid timezone shifts
    const date = XLSX.SSF.parse_date_code(value)
    return new Date(Date.UTC(date.y, date.m - 1, date.d)).toISOString()
  }
  return String(value)
}

interface ImportUploadStepProps {
  onParsed: (rows: SmartImportRow[]) => void
}

export function ImportUploadStep({ onParsed }: ImportUploadStepProps) {
  const { t } = useTranslation('scheduler')
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = useCallback(
    async (file: File) => {
      try {
        setError(null)
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: true })

        if (jsonData.length === 0) {
          setError(t('dialogs.import.validationError'))
          return
        }

        const headers = Object.keys(jsonData[0]).map((h) => h.trim())

        // Check if required Hebrew columns are present
        const requiredCols = ['מחלקה', 'מוסד אקדמי', 'תאריך התחלה', 'תאריך סיום', 'שנת לימוד', 'סוג שיבוץ', 'משמרת']
        const hasRequired = requiredCols.every((col) => headers.includes(col))
        if (!hasRequired) {
          setError(t('dialogs.smartImport.columnError'))
          return
        }

        const rows: SmartImportRow[] = jsonData.map((rawRow) => {
          const mapped: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(rawRow)) {
            const trimmedKey = key.trim()
            const mappedKey = HE_TO_KEY_MAP[trimmedKey]
            if (mappedKey) {
              mapped[mappedKey] = value
            }
          }

          return {
            departmentName: String(mapped.departmentName ?? ''),
            universityName: String(mapped.universityName ?? ''),
            startDate: excelDateToISO(mapped.startDate),
            endDate: excelDateToISO(mapped.endDate),
            studentCount: mapped.studentCount != null ? Number(mapped.studentCount) : null,
            yearInProgram: parseYearInProgram(mapped.yearInProgram),
            placementType: String(mapped.placementType ?? 'רגיל'),
            tutorName: mapped.tutorName ? String(mapped.tutorName) : null,
            shiftType: String(mapped.shiftType ?? 'בוקר'),
          }
        })

        onParsed(rows)
      } catch {
        setError(t('dialogs.import.validationError'))
      }
    },
    [t, onParsed],
  )

  return (
    <div className="flex flex-col gap-4">
      <ExcelDropZone onFileSelected={handleFileSelected} />

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">{t('dialogs.smartImport.expectedColumns')}</p>
        <p>{EXPECTED_COLUMNS_HE.join(' · ')}</p>
      </div>
    </div>
  )
}
