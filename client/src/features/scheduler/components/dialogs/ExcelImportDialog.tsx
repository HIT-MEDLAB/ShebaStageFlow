import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { ExcelDropZone } from './ExcelDropZone'
import { useImportAssignments } from '../../hooks/useImportAssignments'
import { useSchedulerStore } from '../../stores/schedulerStore'
import type { CreateAssignmentDto } from '../../types/scheduler.types'

// Expected column names — English and Hebrew variants
const EXPECTED_COLUMNS_EN = [
  'departmentId',
  'universityId',
  'startDate',
  'endDate',
  'type',
  'shiftType',
  'studentCount',
  'yearInProgram',
  'tutorName',
] as const

const EXPECTED_COLUMNS_HE = [
  'מחלקה',
  'מוסד',
  'תאריך התחלה',
  'תאריך סיום',
  'סוג',
  'משמרת',
  'מספר סטודנטים',
  'שנת לימוד',
  'שם מדריך',
] as const

// Maps Hebrew column names to the DTO keys
const HE_TO_EN_MAP: Record<string, string> = {
  'מחלקה': 'departmentId',
  'מוסד': 'universityId',
  'תאריך התחלה': 'startDate',
  'תאריך סיום': 'endDate',
  'סוג': 'type',
  'משמרת': 'shiftType',
  'מספר סטודנטים': 'studentCount',
  'שנת לימוד': 'yearInProgram',
  'שם מדריך': 'tutorName',
}

function validateColumns(headers: string[]): boolean {
  const normalized = headers.map((h) => h.trim())

  // Check if all English columns are present
  const hasAllEnglish = EXPECTED_COLUMNS_EN.every((col) =>
    normalized.includes(col),
  )
  if (hasAllEnglish) return true

  // Check if all Hebrew columns are present
  const hasAllHebrew = EXPECTED_COLUMNS_HE.every((col) =>
    normalized.includes(col),
  )
  return hasAllHebrew
}

function normalizeRow(
  row: Record<string, unknown>,
  headers: string[],
): Record<string, unknown> {
  const normalized = headers.map((h) => h.trim())
  const isHebrew = EXPECTED_COLUMNS_HE.every((col) =>
    normalized.includes(col),
  )

  if (!isHebrew) return row

  // Map Hebrew keys to English keys
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const trimmedKey = key.trim()
    const englishKey = HE_TO_EN_MAP[trimmedKey] ?? trimmedKey
    mapped[englishKey] = value
  }
  return mapped
}

function parseRow(
  row: Record<string, unknown>,
  academicYearId: number,
): CreateAssignmentDto {
  return {
    departmentId: Number(row.departmentId),
    universityId: Number(row.universityId),
    academicYearId,
    startDate: String(row.startDate),
    endDate: String(row.endDate),
    type: String(row.type) as CreateAssignmentDto['type'],
    shiftType: String(row.shiftType) as CreateAssignmentDto['shiftType'],
    studentCount: row.studentCount != null ? Number(row.studentCount) : null,
    yearInProgram: Number(row.yearInProgram),
    tutorName: row.tutorName ? String(row.tutorName) : null,
  }
}

type ParseState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; count: number; assignments: CreateAssignmentDto[] }

export function ExcelImportDialog() {
  const { t } = useTranslation('scheduler')
  const { activeDialog, closeDialog, academicYearId } = useSchedulerStore()
  const importMutation = useImportAssignments()
  const isOpen = activeDialog === 'import'

  const [parseState, setParseState] = useState<ParseState>({ status: 'idle' })

  const handleClose = useCallback(() => {
    closeDialog()
    setParseState({ status: 'idle' })
  }, [closeDialog])

  const handleFileSelected = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

        if (jsonData.length === 0) {
          setParseState({
            status: 'error',
            message: t('dialogs.import.validationError'),
          })
          return
        }

        // Get headers from first row keys
        const headers = Object.keys(jsonData[0])

        if (!validateColumns(headers)) {
          setParseState({
            status: 'error',
            message: t('dialogs.import.validationError'),
          })
          return
        }

        const assignments = jsonData.map((row) => {
          const normalized = normalizeRow(row, headers)
          return parseRow(normalized, academicYearId ?? 0)
        })

        setParseState({
          status: 'success',
          count: assignments.length,
          assignments,
        })
      } catch {
        setParseState({
          status: 'error',
          message: t('dialogs.import.validationError'),
        })
      }
    },
    [academicYearId, t],
  )

  const handleImport = useCallback(() => {
    if (parseState.status !== 'success') return

    importMutation.mutate(parseState.assignments, {
      onSuccess: () => {
        handleClose()
      },
      onError: () => {
        toast.error(t('toast.importFailed'))
      },
    })
  }, [parseState, importMutation, handleClose, t])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent dir="rtl" className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('dialogs.import.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ExcelDropZone onFileSelected={handleFileSelected} />

          {parseState.status === 'error' && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{parseState.message}</span>
            </div>
          )}

          {parseState.status === 'success' && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                {t('dialogs.import.validationSuccess')}
                {' — '}
                {t('dialogs.import.assignmentsFound', {
                  count: parseState.count,
                })}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('dialogs.manual.cancel')}
          </Button>
          <Button
            type="button"
            disabled={
              parseState.status !== 'success' || importMutation.isPending
            }
            onClick={handleImport}
          >
            {t('dialogs.import.import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
