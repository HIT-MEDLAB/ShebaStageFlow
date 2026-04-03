import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

import type { ImportRowResult, ImportAction, SmartImportRow } from '../../../types/scheduler.types'
import { ImportRowCard } from './ImportRowCard'

interface ImportReviewStepProps {
  rows: ImportRowResult[]
  originalRows: SmartImportRow[]
  deletedRows: Set<number>
  revalidatingRow: number | null
  actions: Map<number, ImportAction | null>
  isAdmin: boolean
  globalWarnings?: string[]
  onSetAction: (rowIndex: number, action: ImportAction | null) => void
  onUndoAction: (rowIndex: number) => void
  onEditRow: (rowIndex: number, editedRow: SmartImportRow) => void
  onDeleteRow: (rowIndex: number) => void
  onValidateWeek?: (params: {
    departmentId: number
    universityId: number
    startDate: string
    endDate: string
    shiftType: 'MORNING' | 'EVENING'
    type: 'GROUP' | 'ELECTIVE'
    studentCount: number | null
    yearInProgram: number
    excludeAssignmentIds: number[]
  }) => Promise<{ valid: boolean; failureReason?: string; failureParams?: Record<string, string | number> }>
}

export function ImportReviewStep({
  rows,
  originalRows,
  deletedRows,
  revalidatingRow,
  actions,
  isAdmin,
  globalWarnings,
  onSetAction,
  onUndoAction,
  onEditRow,
  onDeleteRow,
  onValidateWeek,
}: ImportReviewStepProps) {
  const { t } = useTranslation('scheduler')

  const visibleRows = rows.filter((r) => !deletedRows.has(r.rowIndex))
  const successCount = visibleRows.filter((r) => r.status === 'success').length
  const bumpedCount = visibleRows.filter((r) => r.status === 'bumped').length
  const failedCount = visibleRows.filter((r) => r.status === 'failed').length
  const parseErrorCount = visibleRows.filter((r) => r.status === 'parse_error').length
  const deletedCount = deletedRows.size

  return (
    <div className="flex flex-col gap-3">
      {/* Global warnings banner */}
      {globalWarnings && globalWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            {globalWarnings.map((w, i) => (
              <p key={i}>{t(w)}</p>
            ))}
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-3 text-xs flex-wrap">
        {successCount > 0 && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900 dark:text-green-200">
            {t('dialogs.smartImport.summarySuccess', { count: successCount })}
          </span>
        )}
        {bumpedCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {t('dialogs.smartImport.summaryBumped', { count: bumpedCount })}
          </span>
        )}
        {failedCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900 dark:text-red-200">
            {t('dialogs.smartImport.summaryFailed', { count: failedCount })}
          </span>
        )}
        {parseErrorCount > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {t('dialogs.smartImport.summaryParseError', { count: parseErrorCount })}
          </span>
        )}
        {deletedCount > 0 && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400 line-through">
            {t('dialogs.smartImport.summaryDeleted', { count: deletedCount })}
          </span>
        )}
      </div>

      {/* Row cards */}
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {visibleRows.map((row) => {
          // Determine action for this row
          let action: ImportAction | null | undefined = actions.get(row.rowIndex)

          // For success rows, auto-create action if not explicitly skipped
          if (row.status === 'success' && action === undefined && row.resolvedDto) {
            action = { type: 'create', rowIndex: row.rowIndex, dto: row.resolvedDto }
          }

          // For bumped rows with no decision yet, action is undefined (show picker)
          // For bumped rows that were skipped, action is null

          return (
            <ImportRowCard
              key={row.rowIndex}
              row={row}
              action={action}
              isAdmin={isAdmin}
              originalRow={originalRows[row.rowIndex]}
              isRevalidating={revalidatingRow === row.rowIndex}
              onSetAction={(act) => onSetAction(row.rowIndex, act)}
              onUndoAction={() => onUndoAction(row.rowIndex)}
              onEditRow={(editedRow) => onEditRow(row.rowIndex, editedRow)}
              onDeleteRow={() => onDeleteRow(row.rowIndex)}
              onValidateWeek={onValidateWeek}
            />
          )
        })}
      </div>
    </div>
  )
}
