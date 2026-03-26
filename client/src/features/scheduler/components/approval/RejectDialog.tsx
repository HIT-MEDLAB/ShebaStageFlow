import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useRejectAssignment } from '../../hooks/useApprovalActions'

interface RejectDialogProps {
  open: boolean
  assignmentId: number
  onClose: () => void
}

export function RejectDialog({ open, assignmentId, onClose }: RejectDialogProps) {
  const { t } = useTranslation('scheduler')
  const [reason, setReason] = useState('')
  const rejectMutation = useRejectAssignment()

  function handleConfirm() {
    rejectMutation.mutate(
      { id: assignmentId, rejectionReason: reason || undefined },
      { onSuccess: () => { setReason(''); onClose() } },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setReason(''); onClose() } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('approval.rejectDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col gap-2 mt-2">
              <Label htmlFor="rejection-reason">{t('approval.rejectDialog.reasonLabel')}</Label>
              <Textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('approval.rejectDialog.reasonPlaceholder')}
                rows={3}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('approval.rejectDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {t('approval.rejectDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
