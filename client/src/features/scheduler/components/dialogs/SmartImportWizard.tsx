import { useCallback, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useIsAdmin } from '@/hooks/useIsAdmin'

import { useSchedulerStore } from '../../stores/schedulerStore'
import { smartImportValidate, smartImportExecute, validateDisplacementWeek } from '../../api/scheduler.api'
import type {
  SmartImportRow,
  ImportRowResult,
  ImportAction,
  WizardStep,
  ImportValidationResult,
} from '../../types/scheduler.types'
import { ImportUploadStep } from './import/ImportUploadStep'
import { ImportReviewStep } from './import/ImportReviewStep'

// ── Wizard reducer ──────────────────────────────────────────────

interface WizardState {
  step: WizardStep
  rows: ImportRowResult[]
  originalRows: SmartImportRow[]
  deletedRows: Set<number>
  revalidatingRow: number | null
  actions: Map<number, ImportAction | null>
  globalWarnings?: string[]
  result: { created: number; displaced: number } | null
}

type WizardAction =
  | { type: 'START_VALIDATE'; originalRows: SmartImportRow[] }
  | { type: 'VALIDATE_DONE'; rows: ImportRowResult[]; globalWarnings?: string[] }
  | { type: 'SET_ROW_ACTION'; rowIndex: number; action: ImportAction | null }
  | { type: 'UNDO_ROW_ACTION'; rowIndex: number }
  | { type: 'DELETE_ROW'; rowIndex: number }
  | { type: 'START_REVALIDATE'; rowIndex: number }
  | { type: 'REVALIDATE_DONE'; rowIndex: number; result: ImportRowResult; editedRow: SmartImportRow }
  | { type: 'START_EXECUTE' }
  | { type: 'EXECUTE_DONE'; result: { created: number; displaced: number } }
  | { type: 'RESET' }

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'START_VALIDATE':
      return { ...state, step: 'validating', originalRows: action.originalRows }
    case 'VALIDATE_DONE': {
      // Auto-assign 'create' actions for success rows
      const actions = new Map<number, ImportAction | null>()
      for (const row of action.rows) {
        if (row.status === 'success' && row.resolvedDto) {
          actions.set(row.rowIndex, {
            type: 'create',
            rowIndex: row.rowIndex,
            dto: row.resolvedDto,
          })
        }
        // bumped/failed/parse_error → undefined in map (not yet decided, except parse_error which is always skip)
        if (row.status === 'parse_error') {
          actions.set(row.rowIndex, null)
        }
      }
      return { ...state, step: 'review', rows: action.rows, actions, globalWarnings: action.globalWarnings }
    }
    case 'SET_ROW_ACTION':
      return {
        ...state,
        actions: new Map(state.actions).set(action.rowIndex, action.action),
      }
    case 'UNDO_ROW_ACTION': {
      const newActions = new Map(state.actions)
      newActions.delete(action.rowIndex)
      return { ...state, actions: newActions }
    }
    case 'DELETE_ROW': {
      const newDeleted = new Set(state.deletedRows)
      newDeleted.add(action.rowIndex)
      return {
        ...state,
        deletedRows: newDeleted,
        actions: new Map(state.actions).set(action.rowIndex, null),
      }
    }
    case 'START_REVALIDATE':
      return { ...state, revalidatingRow: action.rowIndex }
    case 'REVALIDATE_DONE': {
      const newRows = [...state.rows]
      const idx = newRows.findIndex((r) => r.rowIndex === action.rowIndex)
      if (idx !== -1) newRows[idx] = action.result
      const newOriginal = [...state.originalRows]
      newOriginal[action.rowIndex] = action.editedRow
      const newActions = new Map(state.actions)
      if (action.result.status === 'success' && action.result.resolvedDto) {
        newActions.set(action.rowIndex, {
          type: 'create',
          rowIndex: action.rowIndex,
          dto: action.result.resolvedDto,
        })
      } else {
        newActions.delete(action.rowIndex)
      }
      return {
        ...state,
        rows: newRows,
        originalRows: newOriginal,
        actions: newActions,
        revalidatingRow: null,
      }
    }
    case 'START_EXECUTE':
      return { ...state, step: 'executing' }
    case 'EXECUTE_DONE':
      return { ...state, step: 'complete', result: action.result }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const initialState: WizardState = {
  step: 'upload',
  rows: [],
  originalRows: [],
  deletedRows: new Set(),
  revalidatingRow: null,
  actions: new Map(),
  result: null,
}

// ── Component ───────────────────────────────────────────────────

export function SmartImportWizard() {
  const { t } = useTranslation('scheduler')
  const { activeDialog, closeDialog, academicYearId } = useSchedulerStore()
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const isOpen = activeDialog === 'smartImport'

  const [state, dispatch] = useReducer(wizardReducer, initialState)

  const validateMutation = useMutation({
    mutationFn: (rows: SmartImportRow[]) =>
      smartImportValidate(academicYearId!, rows),
    onSuccess: (data) => {
      dispatch({ type: 'VALIDATE_DONE', rows: data.rows, globalWarnings: data.globalWarnings })
    },
    onError: () => {
      toast.error(t('toast.importFailed'))
      dispatch({ type: 'RESET' })
    },
  })

  const executeMutation = useMutation({
    mutationFn: (actions: ImportAction[]) =>
      smartImportExecute(academicYearId!, actions),
    onSuccess: (data) => {
      dispatch({ type: 'EXECUTE_DONE', result: data })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
    },
    onError: () => {
      toast.error(t('toast.importFailed'))
      dispatch({ type: 'RESET' })
    },
  })

  const handleClose = useCallback(() => {
    closeDialog()
    dispatch({ type: 'RESET' })
  }, [closeDialog])

  const handleParsed = useCallback(
    (rows: SmartImportRow[]) => {
      if (!academicYearId) {
        toast.error(t('dialogs.validation.academicYearRequired'))
        return
      }
      dispatch({ type: 'START_VALIDATE', originalRows: rows })
      validateMutation.mutate(rows)
    },
    [academicYearId, validateMutation, t],
  )

  const handleSetRowAction = useCallback(
    (rowIndex: number, action: ImportAction | null) => {
      dispatch({ type: 'SET_ROW_ACTION', rowIndex, action })
    },
    [],
  )

  const handleUndoRowAction = useCallback((rowIndex: number) => {
    dispatch({ type: 'UNDO_ROW_ACTION', rowIndex })
  }, [])

  const handleDeleteRow = useCallback((rowIndex: number) => {
    dispatch({ type: 'DELETE_ROW', rowIndex })
  }, [])

  const handleEditRow = useCallback(
    async (rowIndex: number, editedRow: SmartImportRow) => {
      if (!academicYearId) return
      dispatch({ type: 'START_REVALIDATE', rowIndex })
      try {
        const data: ImportValidationResult = await smartImportValidate(academicYearId, [editedRow])
        const result = data.rows[0]
        // Preserve the original rowIndex
        dispatch({ type: 'REVALIDATE_DONE', rowIndex, result: { ...result, rowIndex }, editedRow })
      } catch {
        toast.error(t('toast.importFailed'))
        dispatch({ type: 'REVALIDATE_DONE', rowIndex, result: state.rows.find((r) => r.rowIndex === rowIndex)!, editedRow })
      }
    },
    [academicYearId, t, state.rows],
  )

  const handleValidateWeek = useCallback(
    async (params: {
      departmentId: number
      universityId: number
      startDate: string
      endDate: string
      shiftType: 'MORNING' | 'EVENING'
      type: 'GROUP' | 'ELECTIVE'
      studentCount: number | null
      yearInProgram: number
      excludeAssignmentIds: number[]
    }) => {
      return validateDisplacementWeek(params)
    },
    [],
  )

  const handleExecute = useCallback(() => {
    const actionsToExecute: ImportAction[] = []
    for (const [, action] of state.actions) {
      if (action) actionsToExecute.push(action)
    }
    if (actionsToExecute.length === 0) {
      toast.error(t('dialogs.smartImport.noActions'))
      return
    }
    dispatch({ type: 'START_EXECUTE' })
    executeMutation.mutate(actionsToExecute)
  }, [state.actions, executeMutation, t])

  // Check if all bumped rows have been resolved
  const unresolvedBumped = state.rows.filter(
    (r) => r.status === 'bumped' && !state.actions.has(r.rowIndex),
  )

  const actionCount = [...state.actions.values()].filter(Boolean).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent dir="rtl" className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('dialogs.smartImport.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {state.step === 'upload' && (
            <ImportUploadStep onParsed={handleParsed} />
          )}

          {state.step === 'validating' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('dialogs.smartImport.validating')}
              </p>
            </div>
          )}

          {state.step === 'review' && (
            <ImportReviewStep
              rows={state.rows}
              originalRows={state.originalRows}
              deletedRows={state.deletedRows}
              revalidatingRow={state.revalidatingRow}
              actions={state.actions}
              isAdmin={isAdmin}
              globalWarnings={state.globalWarnings}
              onSetAction={handleSetRowAction}
              onUndoAction={handleUndoRowAction}
              onEditRow={handleEditRow}
              onDeleteRow={handleDeleteRow}
              onValidateWeek={handleValidateWeek}
            />
          )}

          {state.step === 'executing' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('dialogs.smartImport.executing')}
              </p>
            </div>
          )}

          {state.step === 'complete' && state.result && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <CheckCircle2 className="size-10 text-green-600" />
              <p className="text-sm font-medium">
                {t('dialogs.smartImport.complete', {
                  created: state.result.created,
                  displaced: state.result.displaced,
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 shrink-0">
          {state.step === 'review' && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('dialogs.manual.cancel')}
              </Button>
              <Button
                type="button"
                disabled={
                  unresolvedBumped.length > 0 ||
                  actionCount === 0 ||
                  executeMutation.isPending
                }
                onClick={handleExecute}
              >
                {t('dialogs.smartImport.execute', { count: actionCount })}
              </Button>
            </>
          )}
          {state.step === 'complete' && (
            <Button type="button" onClick={handleClose}>
              {t('dialogs.smartImport.close')}
            </Button>
          )}
          {(state.step === 'upload') && (
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('dialogs.manual.cancel')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
