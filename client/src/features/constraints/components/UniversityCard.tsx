import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { universityFormSchema, type UniversityFormValues } from '../schemas/constraints.schemas'
import type { UniversityWithSemester } from '../types/constraints.types'

interface UniversityCardProps {
  universities: UniversityWithSemester[]
  isAdmin: boolean
  onCreate: (data: UniversityFormValues) => void
  onUpdate: (id: number, data: UniversityFormValues) => void
  isCreatePending: boolean
  isUpdatePending: boolean
}

export function UniversityCard({
  universities,
  isAdmin,
  onCreate,
  onUpdate,
  isCreatePending,
  isUpdatePending,
}: UniversityCardProps) {
  const { t } = useTranslation('constraints')
  const [mode, setMode] = useState<'add' | 'edit'>('edit')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UniversityFormValues>({
    resolver: zodResolver(universityFormSchema),
    defaultValues: {
      name: '',
      priority: 0,
      semesterStart: '',
      semesterEnd: '',
      year: new Date().getFullYear(),
    },
  })

  function handleSelectUniversity(idStr: string) {
    const id = Number(idStr)
    setSelectedId(id)
    const uni = universities.find((u) => u.id === id)
    if (uni) {
      const semester = uni.semesters[0]
      reset({
        name: uni.name,
        priority: uni.priority,
        semesterStart: semester ? format(new Date(semester.semesterStart), 'yyyy-MM-dd') : '',
        semesterEnd: semester ? format(new Date(semester.semesterEnd), 'yyyy-MM-dd') : '',
        year: semester?.year ?? new Date().getFullYear(),
      })
    }
  }

  function handleModeSwitch(newMode: 'add' | 'edit') {
    setMode(newMode)
    setSelectedId(null)
    reset({
      name: '',
      priority: 0,
      semesterStart: '',
      semesterEnd: '',
      year: new Date().getFullYear(),
    })
  }

  function onSubmit(data: UniversityFormValues) {
    if (mode === 'edit' && selectedId) {
      onUpdate(selectedId, data)
    } else {
      onCreate(data)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('university.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            {universities.map((u) => {
              const s = u.semesters[0]
              return (
                <div key={u.id} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{u.name}</span>
                  <span>
                    {s
                      ? `${format(new Date(s.semesterStart), 'dd/MM/yyyy')} – ${format(new Date(s.semesterEnd), 'dd/MM/yyyy')}`
                      : '-'}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('university.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSwitch('edit')}
          >
            {t('university.editExisting')}
          </Button>
          <Button
            variant={mode === 'add' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSwitch('add')}
          >
            {t('university.addNew')}
          </Button>
        </div>

        {mode === 'edit' && (
          <div className="mb-4">
            <Label>{t('university.selectUniversity')}</Label>
            <Select
              value={selectedId?.toString() ?? ''}
              onValueChange={handleSelectUniversity}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('university.selectUniversity')} />
              </SelectTrigger>
              <SelectContent>
                {universities.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('form.name')}</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('university.priority')}</Label>
              <Input type="number" min={0} {...register('priority')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('university.semesterStart')}</Label>
              <Input type="date" {...register('semesterStart')} />
              {errors.semesterStart && (
                <p className="text-sm text-destructive">{errors.semesterStart.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('university.semesterEnd')}</Label>
              <Input type="date" {...register('semesterEnd')} />
              {errors.semesterEnd && (
                <p className="text-sm text-destructive">{errors.semesterEnd.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('university.year')}</Label>
              <Input type="number" {...register('year')} />
              {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isCreatePending || isUpdatePending || (mode === 'edit' && !selectedId)}
            >
              {mode === 'edit' ? t('form.save') : t('form.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
