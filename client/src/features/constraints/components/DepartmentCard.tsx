import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { departmentFormSchema, type DepartmentFormValues } from '../schemas/constraints.schemas'
import type { DepartmentWithConstraint } from '../types/constraints.types'

interface DepartmentCardProps {
  departments: DepartmentWithConstraint[]
  isAdmin: boolean
  onCreate: (data: DepartmentFormValues) => void
  onUpdate: (id: number, data: DepartmentFormValues) => void
  isCreatePending: boolean
  isUpdatePending: boolean
}

export function DepartmentCard({
  departments,
  isAdmin,
  onCreate,
  onUpdate,
  isCreatePending,
  isUpdatePending,
}: DepartmentCardProps) {
  const { t } = useTranslation('constraints')
  const [mode, setMode] = useState<'add' | 'edit'>('edit')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      hasMorningShift: true,
      hasEveningShift: false,
      morningCapacity: 1,
      eveningCapacity: 0,
      electiveCapacity: 0,
    },
  })

  const hasMorningShift = watch('hasMorningShift')
  const hasEveningShift = watch('hasEveningShift')

  function handleSelectDepartment(idStr: string) {
    const id = Number(idStr)
    setSelectedId(id)
    const dept = departments.find((d) => d.id === id)
    if (dept) {
      const constraint = dept.departmentConstraints[0]
      reset({
        name: dept.name,
        hasMorningShift: dept.hasMorningShift,
        hasEveningShift: dept.hasEveningShift,
        morningCapacity: constraint?.morningCapacity ?? 1,
        eveningCapacity: constraint?.eveningCapacity ?? 0,
        electiveCapacity: constraint?.electiveCapacity ?? 0,
      })
    }
  }

  function handleModeSwitch(newMode: 'add' | 'edit') {
    setMode(newMode)
    setSelectedId(null)
    reset({
      name: '',
      hasMorningShift: true,
      hasEveningShift: false,
      morningCapacity: 1,
      eveningCapacity: 0,
      electiveCapacity: 0,
    })
  }

  function onSubmit(data: DepartmentFormValues) {
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
          <CardTitle>{t('department.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            {departments.map((d) => {
              const c = d.departmentConstraints[0]
              return (
                <div key={d.id} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{d.name}</span>
                  <span>
                    {t('department.morningCapacity')}: {c?.morningCapacity ?? '-'}
                    {d.hasEveningShift && ` | ${t('department.eveningCapacity')}: ${c?.eveningCapacity ?? '-'}`}
                    {` | ${t('department.electiveCapacity')}: ${c?.electiveCapacity ?? '-'}`}
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
        <CardTitle>{t('department.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSwitch('edit')}
          >
            {t('department.editExisting')}
          </Button>
          <Button
            variant={mode === 'add' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSwitch('add')}
          >
            {t('department.addNew')}
          </Button>
        </div>

        {mode === 'edit' && (
          <div className="mb-4">
            <Label>{t('department.selectDepartment')}</Label>
            <Select
              value={selectedId?.toString() ?? ''}
              onValueChange={handleSelectDepartment}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('department.selectDepartment')} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.name')}</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={hasMorningShift}
                onCheckedChange={(val) => {
                  setValue('hasMorningShift', val)
                  if (!val) setValue('morningCapacity', 0)
                }}
              />
              <Label>{t('department.hasMorningShift')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={hasEveningShift}
                onCheckedChange={(val) => {
                  setValue('hasEveningShift', val)
                  if (!val) setValue('eveningCapacity', 0)
                }}
              />
              <Label>{t('department.hasEveningShift')}</Label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('department.morningCapacity')}</Label>
              <Input type="number" min={0} {...register('morningCapacity')} disabled={!hasMorningShift} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('department.eveningCapacity')}</Label>
              <Input type="number" min={0} {...register('eveningCapacity')} disabled={!hasEveningShift} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('department.electiveCapacity')}</Label>
              <Input type="number" min={0} {...register('electiveCapacity')} />
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
