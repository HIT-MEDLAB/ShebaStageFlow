import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ImportRowResult, ImportAction, SmartImportRow } from '../../../types/scheduler.types'
import { ImportWeekPicker } from './ImportWeekPicker'
import { ImportRowEditDialog } from './ImportRowEditDialog'

interface ImportRowCardProps {
  row: ImportRowResult
  action: ImportAction | null | undefined
  isAdmin: boolean
  originalRow?: SmartImportRow
  isRevalidating?: boolean
  onSetAction: (action: ImportAction | null) => void
  onUndoAction?: () => void
  onEditRow?: (editedRow: SmartImportRow) => void
  onDeleteRow?: () => void
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

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  bumped: {
    icon: AlertTriangle,
    color: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  failed: {
    icon: XCircle,
    color: 'border-destructive/50 bg-destructive/10',
    iconColor: 'text-destructive',
  },
  parse_error: {
    icon: AlertCircle,
    color: 'border-muted bg-muted/50',
    iconColor: 'text-muted-foreground',
  },
} as const

export function ImportRowCard({
  row,
  action,
  isAdmin,
  originalRow,
  isRevalidating,
  onSetAction,
  onUndoAction,
  onEditRow,
  onDeleteRow,
  onValidateWeek,
}: ImportRowCardProps) {
  const { t } = useTranslation('scheduler')
  const [isEditing, setIsEditing] = useState(false)
  const [isValidatingWeek, setIsValidatingWeek] = useState(false)
  const [weekValidationError, setWeekValidationError] = useState<string | undefined>()
  const config = statusConfig[row.status]
  const Icon = config.icon

  const dto = row.resolvedDto

  async function handleSelectWeek(startDate: string, endDate: string) {
    if (!dto || !row.bumpedAssignment) return

    setWeekValidationError(undefined)

    if (onValidateWeek) {
      setIsValidatingWeek(true)
      try {
        const result = await onValidateWeek({
          departmentId: row.bumpedAssignment.departmentId,
          universityId: row.bumpedAssignment.universityId,
          startDate,
          endDate,
          shiftType: row.bumpedAssignment.shiftType,
          type: row.bumpedAssignment.type,
          studentCount: row.bumpedAssignment.studentCount,
          yearInProgram: row.bumpedAssignment.yearInProgram,
          excludeAssignmentIds: [row.bumpedAssignment.id],
        })
        if (!result.valid) {
          setWeekValidationError(
            result.failureReason
              ? t(result.failureReason, result.failureParams as Record<string, string> | undefined)
              : t('dialogs.smartImport.weekInvalid'),
          )
          return
        }
      } catch {
        setWeekValidationError(t('dialogs.smartImport.weekValidationFailed'))
        return
      } finally {
        setIsValidatingWeek(false)
      }
    }

    onSetAction({
      type: 'displace',
      rowIndex: row.rowIndex,
      dto,
      displacedAssignmentId: row.bumpedAssignment.id,
      displacedDepartmentId: row.bumpedAssignment.departmentId,
      displacedStartDate: startDate,
      displacedEndDate: endDate,
    })
  }

  function handleSkip() {
    onSetAction(null)
  }

  function handleForce() {
    if (!dto) return
    onSetAction({
      type: 'force_create',
      rowIndex: row.rowIndex,
      dto,
    })
  }

  function handleSaveEdit(editedRow: SmartImportRow) {
    onEditRow?.(editedRow)
    setIsEditing(false)
  }

  return (
    <div className={cn('rounded-md border p-3 text-sm', config.color)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('size-4 shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1 min-w-0">
          {/* Row header */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              {t('dialogs.smartImport.row', { num: row.rowIndex + 1 })}
              {dto && (
                <span className="font-normal text-muted-foreground ms-2">
                  {dto.departmentId} · {format(new Date(dto.startDate), 'dd/MM')}–{format(new Date(dto.endDate), 'dd/MM')}
                </span>
              )}
            </span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded', {
              'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200': row.status === 'success',
              'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200': row.status === 'bumped',
              'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200': row.status === 'failed',
              'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200': row.status === 'parse_error',
            })}>
              {t(`dialogs.smartImport.status.${row.status}`)}
            </span>
          </div>

          {/* Status-specific content */}
          {row.status === 'parse_error' && row.parseErrors && (
            <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
              {row.parseErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {row.status === 'success' && row.warnings && row.warnings.length > 0 && (
            <ul className="mt-1 text-xs text-amber-600 dark:text-amber-400 list-disc list-inside">
              {row.warnings.map((w, i) => (
                <li key={i}>{t(w)}</li>
              ))}
            </ul>
          )}

          {row.status === 'failed' && row.failureReason && (
            <p className="mt-1 text-xs text-destructive">
              {t(row.failureReason, row.failureParams as Record<string, string> | undefined)}
            </p>
          )}

          {row.status === 'bumped' && row.bumpedAssignment && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {t('dialogs.smartImport.bumpsAssignment', {
                university: row.bumpedAssignment.universityName,
                department: row.bumpedAssignment.departmentName,
              })}
            </p>
          )}

          {/* Actions for bumped rows */}
          {row.status === 'bumped' && (
            <div className="mt-2 flex flex-col gap-2">
              {action?.type === 'displace' ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-green-600" />
                  <span className="text-xs text-green-700 dark:text-green-300">
                    {t('dialogs.smartImport.resolved')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs ms-auto"
                    onClick={handleSkip}
                  >
                    {t('dialogs.smartImport.skip')}
                  </Button>
                </div>
              ) : action === null ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t('dialogs.smartImport.skipped')}
                  </span>
                  {onUndoAction && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs ms-auto"
                      onClick={onUndoAction}
                    >
                      {t('dialogs.smartImport.undo')}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <ImportWeekPicker
                    suggestedWeeks={row.suggestedWeeks ?? []}
                    onSelect={handleSelectWeek}
                    isValidating={isValidatingWeek}
                    validationError={weekValidationError}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs self-start"
                    onClick={handleSkip}
                  >
                    {t('dialogs.smartImport.skip')}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Actions for failed rows */}
          {row.status === 'failed' && (
            <div className="mt-2 flex items-center gap-2">
              {action?.type === 'force_create' ? (
                <>
                  <CheckCircle2 className="size-3 text-green-600" />
                  <span className="text-xs text-green-700 dark:text-green-300">
                    {t('dialogs.smartImport.forceOverride')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs ms-auto"
                    onClick={handleSkip}
                  >
                    {t('dialogs.smartImport.undo')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={onDeleteRow}
                    title={t('dialogs.smartImport.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  {isAdmin && dto && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleForce}
                    >
                      {t('dialogs.smartImport.force')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing || isRevalidating}
                    title={t('dialogs.smartImport.edit')}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={onDeleteRow}
                    title={t('dialogs.smartImport.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Actions for parse_error rows */}
          {row.status === 'parse_error' && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setIsEditing(true)}
                disabled={isEditing || isRevalidating}
                title={t('dialogs.smartImport.edit')}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={onDeleteRow}
                title={t('dialogs.smartImport.delete')}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Edit dialog */}
          {originalRow && (
            <ImportRowEditDialog
              open={isEditing}
              initialData={originalRow}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
              isLoading={isRevalidating}
            />
          )}
        </div>
      </div>
    </div>
  )
}
