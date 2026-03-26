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

interface AdminOverrideDialogProps {
  open: boolean
  reasonKey: string
  reasonParams?: Record<string, string>
  onConfirm: () => void
  onCancel: () => void
}

export function AdminOverrideDialog({
  open,
  reasonKey,
  reasonParams,
  onConfirm,
  onCancel,
}: AdminOverrideDialogProps) {
  const { t } = useTranslation('scheduler')

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            {t('dialogs.adminOverride.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('dialogs.adminOverride.description')}
            {' '}
            {t(reasonKey, reasonParams)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('dialogs.adminOverride.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {t('dialogs.adminOverride.force')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
