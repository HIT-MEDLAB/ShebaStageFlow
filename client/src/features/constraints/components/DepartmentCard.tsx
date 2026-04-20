import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { departmentFormSchema, type DepartmentFormValues } from '../schemas/constraints.schemas'
import type { DepartmentWithConstraint } from '../types/constraints.types'

interface DepartmentCardProps {
  departments: DepartmentWithConstraint[]
  isAdmin: boolean
  academicYearId: number | null
  onCreate: (data: DepartmentFormValues) => void
  onUpdate: (id: number, data: DepartmentFormValues) => void
  onDelete: (id: number) => void
  onArchive: (id: number, isActive: boolean) => void
  isCreatePending: boolean
  isUpdatePending: boolean
  isDeletePending: boolean
  isArchivePending: boolean
}

export function DepartmentCard({
  departments,
  isAdmin,
  academicYearId,
  onCreate,
  onUpdate,
  onDelete,
  onArchive,
  isCreatePending,
  isUpdatePending,
  isDeletePending,
  isArchivePending,
}: DepartmentCardProps) {
  const { t } = useTranslation('constraints')
  const [mode, setMode] = useState<'add' | 'edit'>('edit')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const selectedDepartment = departments.find((d) => d.id === selectedId) ?? null
  const selectedConstraint = selectedDepartment?.departmentConstraints[0] ?? null

  // Show all departments (even those without config for this year in edit mode)
  // Filter by year-scoped isActive for archive display
  const visibleDepartments = showArchived
    ? departments
    : departments.filter((d) => {
        const constraint = d.departmentConstraints[0]
        // Show if no constraint (not configured) or if active
        return !constraint || constraint.isActive
      })

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
        hasMorningShift: constraint?.hasMorningShift ?? dept.hasMorningShift,
        hasEveningShift: constraint?.hasEveningShift ?? dept.hasEveningShift,
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

  // Determine archive state from year-scoped constraint
  const isArchivedForYear = selectedConstraint ? !selectedConstraint.isActive : false
  const isNotConfigured = selectedDepartment && !selectedConstraint

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('department.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            {departments.filter((d) => {
              const c = d.departmentConstraints[0]
              return c && c.isActive
            }).map((d) => {
              const c = d.departmentConstraints[0]
              return (
                <div key={d.id} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{d.name}</span>
                  <span>
                    {t('department.morningCapacity')}: {c?.morningCapacity ?? '-'}
                    {c?.hasEveningShift && ` | ${t('department.eveningCapacity')}: ${c?.eveningCapacity ?? '-'}`}
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
            <div className="flex items-center justify-between mb-1">
              <Label>{t('department.selectDepartment')}</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">
                  {t('department.showArchived')}
                </Label>
                <Switch
                  checked={showArchived}
                  onCheckedChange={(val) => {
                    setShowArchived(val)
                    if (!val && selectedConstraint && !selectedConstraint.isActive) {
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
                  }}
                />
              </div>
            </div>
            <Select
              value={selectedId?.toString() ?? ''}
              onValueChange={handleSelectDepartment}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('department.selectDepartment')} />
              </SelectTrigger>
              <SelectContent>
                {visibleDepartments.map((d) => {
                  const constraint = d.departmentConstraints[0]
                  const archived = constraint && !constraint.isActive
                  const notConfigured = !constraint
                  return (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      <span className={archived ? 'opacity-60' : ''}>{d.name}</span>
                      {archived && (
                        <Badge variant="secondary" className="ms-2">
                          {t('department.archivedBadge')}
                        </Badge>
                      )}
                      {notConfigured && (
                        <Badge variant="outline" className="ms-2">
                          {t('department.notConfigured')}
                        </Badge>
                      )}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === 'edit' && isNotConfigured && selectedId && (
          <div className="mb-4 p-3 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {t('department.notConfigured')}
            </p>
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

          <div className="flex justify-between">
            <div className="flex gap-2">
              {mode === 'edit' && selectedId && selectedDepartment && selectedConstraint && (
                <>
                  {!isArchivedForYear ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" type="button" disabled={isArchivePending}>
                          <Archive className="size-4 me-2" />
                          {t('actions.archive')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('dialog.archiveDepartmentTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('dialog.archiveDepartmentConfirm')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              onArchive(selectedId, false)
                              setSelectedId(null)
                              reset({
                                name: '',
                                hasMorningShift: true,
                                hasEveningShift: false,
                                morningCapacity: 1,
                                eveningCapacity: 0,
                                electiveCapacity: 0,
                              })
                            }}
                          >
                            {t('actions.archive')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isArchivePending}
                      onClick={() => onArchive(selectedId, true)}
                    >
                      <ArchiveRestore className="size-4 me-2" />
                      {t('actions.unarchive')}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button" disabled={isDeletePending}>
                        <Trash2 className="size-4 me-2" />
                        {t('actions.delete')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('dialog.deleteDepartmentTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('dialog.deleteDepartmentConfirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onDelete(selectedId)
                            setSelectedId(null)
                            reset({
                              name: '',
                              hasMorningShift: true,
                              hasEveningShift: false,
                              morningCapacity: 1,
                              eveningCapacity: 0,
                              electiveCapacity: 0,
                            })
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('actions.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
            <Button
              type="submit"
              disabled={isCreatePending || isUpdatePending || (mode === 'edit' && !selectedId) || !academicYearId}
            >
              {mode === 'edit' ? t('form.save') : t('form.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
