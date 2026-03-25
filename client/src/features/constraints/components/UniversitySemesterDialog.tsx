import { useEffect, useMemo, useState } from 'react'
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
import {
  useUniversities,
  useUniversitySemesters,
  useCreateSemester,
  useUpdateSemester,
} from '../hooks/useUniversitySemesters'
import {
  createUniversitySemesterFormSchema,
  type UniversitySemesterFormData,
} from '../schemas/constraints.schema'

interface UniversitySemesterDialogProps {
  open: boolean
  onClose: () => void
}

function toDateInputValue(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0] ?? ''
}

export function UniversitySemesterDialog({ open, onClose }: UniversitySemesterDialogProps) {
  const { t } = useTranslation('constraints')
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('')

  const { data: universities } = useUniversities()
  const universityId = selectedUniversityId ? Number(selectedUniversityId) : null
  const { data: semesters } = useUniversitySemesters(universityId)

  const currentYear = new Date().getFullYear()
  const existingSemester = semesters?.find((s) => s.year === currentYear)

  const schema = useMemo(() => createUniversitySemesterFormSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UniversitySemesterFormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (universityId) {
      setValue('universityId', universityId)
    }
  }, [universityId, setValue])

  useEffect(() => {
    if (existingSemester) {
      reset({
        universityId: existingSemester.universityId,
        semesterStart: toDateInputValue(existingSemester.semesterStart),
        semesterEnd: toDateInputValue(existingSemester.semesterEnd),
      })
    } else if (universityId) {
      reset({
        universityId,
        semesterStart: '',
        semesterEnd: '',
      })
    }
  }, [existingSemester, universityId, reset])

  const createMutation = useCreateSemester()
  const updateMutation = useUpdateSemester()
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleClose = () => {
    setSelectedUniversityId('')
    onClose()
  }

  const onSubmit = (data: UniversitySemesterFormData) => {
    if (existingSemester) {
      updateMutation.mutate(
        {
          id: existingSemester.id,
          data: { semesterStart: data.semesterStart, semesterEnd: data.semesterEnd },
        },
        { onSuccess: () => handleClose() },
      )
    } else {
      createMutation.mutate(
        {
          universityId: data.universityId,
          semesterStart: data.semesterStart,
          semesterEnd: data.semesterEnd,
        },
        { onSuccess: () => handleClose() },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.university.title')}</DialogTitle>
          <DialogDescription>{t('dialogs.university.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('dialogs.university.universityLabel')}</Label>
            <Select
              value={selectedUniversityId}
              onValueChange={(val) => {
                setSelectedUniversityId(val)
                setValue('universityId', Number(val))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('dialogs.university.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {universities?.map((uni) => (
                  <SelectItem key={uni.id} value={String(uni.id)}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.universityId && (
              <p className="text-sm text-destructive">{errors.universityId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semesterStart">{t('dialogs.university.semesterStart')}</Label>
              <Input id="semesterStart" type="date" {...register('semesterStart')} />
              {errors.semesterStart && (
                <p className="text-sm text-destructive">{errors.semesterStart.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="semesterEnd">{t('dialogs.university.semesterEnd')}</Label>
              <Input id="semesterEnd" type="date" {...register('semesterEnd')} />
              {errors.semesterEnd && (
                <p className="text-sm text-destructive">{errors.semesterEnd.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              {t('dialogs.university.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t('dialogs.university.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
