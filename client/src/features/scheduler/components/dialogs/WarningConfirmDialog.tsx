import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface WarningConfirmDialogProps {
  open: boolean
  reasonKey: string
  reasonParams?: Record<string, string>
  onConfirm: () => void
  onCancel: () => void
}

export function WarningConfirmDialog({
  open,
  reasonKey,
  reasonParams,
  onConfirm,
  onCancel,
}: WarningConfirmDialogProps) {
  const { t } = useTranslation('scheduler')

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            {t('dialogs.warningConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('dialogs.warningConfirm.description')}
            {' '}
            {t(reasonKey, reasonParams)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('dialogs.warningConfirm.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {t('dialogs.warningConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
