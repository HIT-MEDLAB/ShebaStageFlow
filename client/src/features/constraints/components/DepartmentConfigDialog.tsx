import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDepartments, useDepartmentConstraint } from '../hooks/useDepartments'
import { useUpsertDepartmentConstraint } from '../hooks/useDepartmentConstraintMutations'
import {
  createDepartmentConstraintFormSchema,
  type DepartmentConstraintFormData,
} from '../schemas/constraints.schema'

interface DepartmentConfigDialogProps {
  open: boolean
  onClose: () => void
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0] ?? ''
}

export function DepartmentConfigDialog({ open, onClose }: DepartmentConfigDialogProps) {
  const { t } = useTranslation('constraints')
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')

  const { data: departments } = useDepartments()
  const departmentId = selectedDepartmentId ? Number(selectedDepartmentId) : null
  const { data: existingConstraint } = useDepartmentConstraint(step === 2 ? departmentId : null)
  const upsertMutation = useUpsertDepartmentConstraint()

  const selectedDepartment = departments?.find((d) => d.id === departmentId)

  const schema = useMemo(() => createDepartmentConstraintFormSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentConstraintFormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (step === 2 && existingConstraint) {
      reset({
        morningCapacity: existingConstraint.morningCapacity,
        eveningCapacity: existingConstraint.eveningCapacity,
        electiveCapacity: existingConstraint.electiveCapacity,
        blockedStartDate: toDateInputValue(existingConstraint.blockedStartDate),
        blockedEndDate: toDateInputValue(existingConstraint.blockedEndDate),
      })
    } else if (step === 2 && existingConstraint === null) {
      reset({
        morningCapacity: 1,
        eveningCapacity: 0,
        electiveCapacity: 0,
        blockedStartDate: '',
        blockedEndDate: '',
      })
    }
  }, [step, existingConstraint, reset])

  const handleClose = () => {
    setStep(1)
    setSelectedDepartmentId('')
    onClose()
  }

  const onSubmit = (data: DepartmentConstraintFormData) => {
    if (!departmentId) return
    upsertMutation.mutate(
      {
        departmentId,
        data: {
          morningCapacity: data.morningCapacity,
          eveningCapacity: data.eveningCapacity,
          electiveCapacity: data.electiveCapacity,
          blockedStartDate: data.blockedStartDate || null,
          blockedEndDate: data.blockedEndDate || null,
        },
      },
      { onSuccess: () => handleClose() },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('dialogs.department.selectTitle')}</DialogTitle>
              <DialogDescription>{t('dialogs.department.selectSubtitle')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('dialogs.department.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  {t('dialogs.department.cancel')}
                </Button>
                <Button disabled={!selectedDepartmentId} onClick={() => setStep(2)}>
                  {t('dialogs.department.continue')}
                </Button>
              </DialogFooter>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {t('dialogs.department.settingsTitle', { name: selectedDepartment?.name })}
              </DialogTitle>
              <DialogDescription>{t('dialogs.department.settingsSubtitle')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t('dialogs.department.capacity')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="morningCapacity">{t('dialogs.department.morningCapacity')}</Label>
                    <Input id="morningCapacity" type="number" min={0} {...register('morningCapacity')} />
                    {errors.morningCapacity && (
                      <p className="text-sm text-destructive">{errors.morningCapacity.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eveningCapacity">{t('dialogs.department.eveningCapacity')}</Label>
                    <Input id="eveningCapacity" type="number" min={0} {...register('eveningCapacity')} />
                    {errors.eveningCapacity && (
                      <p className="text-sm text-destructive">{errors.eveningCapacity.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t('dialogs.department.electives')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="electiveCapacity">{t('dialogs.department.electiveCapacity')}</Label>
                  <Input
                    id="electiveCapacity"
                    type="number"
                    min={0}
                    className="w-1/2"
                    {...register('electiveCapacity')}
                  />
                  {errors.electiveCapacity && (
                    <p className="text-sm text-destructive">{errors.electiveCapacity.message}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {t('dialogs.department.blockedPeriod')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blockedStartDate">{t('dialogs.department.blockedStart')}</Label>
                    <Input id="blockedStartDate" type="date" {...register('blockedStartDate')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blockedEndDate">{t('dialogs.department.blockedEnd')}</Label>
                    <Input id="blockedEndDate" type="date" {...register('blockedEndDate')} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  {t('dialogs.department.back')}
                </Button>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {t('dialogs.department.save')}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
