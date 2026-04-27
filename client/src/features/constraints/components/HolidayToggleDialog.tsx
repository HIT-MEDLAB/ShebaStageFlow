import { useTranslation } from 'react-i18next'
import { Ban, CalendarDays } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface HolidayToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  constraintName: string | null
  onConfirm: (blocksWeek: boolean) => void
}

export function HolidayToggleDialog({
  open,
  onOpenChange,
  constraintName,
  onConfirm,
}: HolidayToggleDialogProps) {
  const { t } = useTranslation('constraints')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('holidayToggle.title', { name: constraintName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('holidayToggle.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => onConfirm(true)}
          >
            <Ban className="size-4 me-2" />
            {t('holidayToggle.blockWeek')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onConfirm(false)}
          >
            <CalendarDays className="size-4 me-2" />
            {t('holidayToggle.keepOpen')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
