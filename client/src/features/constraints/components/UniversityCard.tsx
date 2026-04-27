import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
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
import { universityFormSchema, type UniversityFormValues } from '../schemas/constraints.schemas'
import type { UniversityWithSemester } from '../types/constraints.types'

interface UniversityCardProps {
  universities: UniversityWithSemester[]
  isAdmin: boolean
  calendarYear?: number
  onCreate: (data: UniversityFormValues) => void
  onUpdate: (id: number, data: UniversityFormValues) => void
  onDelete: (id: number) => void
  onArchive: (id: number, isActive: boolean) => void
  isCreatePending: boolean
  isUpdatePending: boolean
  isDeletePending: boolean
  isArchivePending: boolean
}

export function UniversityCard({
  universities,
  isAdmin,
  calendarYear,
  onCreate,
  onUpdate,
  onDelete,
  onArchive,
  isCreatePending,
  isUpdatePending,
  isDeletePending,
  isArchivePending,
}: UniversityCardProps) {
  const { t } = useTranslation('constraints')
  const [mode, setMode] = useState<'add' | 'edit'>('edit')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const selectedUniversity = universities.find((u) => u.id === selectedId) ?? null
  const selectedSemester = selectedUniversity?.semesters[0] ?? null

  const visibleUniversities = showArchived
    ? universities
    : universities.filter((u) => {
        const semester = u.semesters[0]
        return !semester || semester.isActive
      })

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
        priority: semester?.priority ?? uni.priority,
        semesterStart: semester ? format(new Date(semester.semesterStart), 'yyyy-MM-dd') : '',
        semesterEnd: semester ? format(new Date(semester.semesterEnd), 'yyyy-MM-dd') : '',
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
    })
  }

  function onSubmit(data: UniversityFormValues) {
    if (mode === 'edit' && selectedId) {
      onUpdate(selectedId, data)
    } else {
      onCreate(data)
    }
  }

  const isArchivedForYear = selectedSemester ? !selectedSemester.isActive : false
  const isNotConfigured = selectedUniversity && !selectedSemester

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('university.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            {universities.filter((u) => {
              const s = u.semesters[0]
              return s && s.isActive
            }).map((u) => {
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
            <div className="flex items-center justify-between mb-1">
              <Label>{t('university.selectUniversity')}</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">
                  {t('university.showArchived')}
                </Label>
                <Switch
                  checked={showArchived}
                  onCheckedChange={(val) => {
                    setShowArchived(val)
                    if (!val && selectedSemester && !selectedSemester.isActive) {
                      setSelectedId(null)
                      reset({
                        name: '',
                        priority: 0,
                        semesterStart: '',
                        semesterEnd: '',
                      })
                    }
                  }}
                />
              </div>
            </div>
            <Select
              value={selectedId?.toString() ?? ''}
              onValueChange={handleSelectUniversity}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('university.selectUniversity')} />
              </SelectTrigger>
              <SelectContent>
                {visibleUniversities.map((u) => {
                  const semester = u.semesters[0]
                  const archived = semester && !semester.isActive
                  const notConfigured = !semester
                  return (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      <span className={archived ? 'opacity-60' : ''}>{u.name}</span>
                      {archived && (
                        <Badge variant="secondary" className="ms-2">
                          {t('university.archivedBadge')}
                        </Badge>
                      )}
                      {notConfigured && (
                        <Badge variant="outline" className="ms-2">
                          {t('university.notConfigured')}
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
              {t('university.notConfigured')}
            </p>
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

          <div className="grid grid-cols-2 gap-4">
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
                <p className="text-sm text-destructive">
                  {errors.semesterEnd.message === 'endBeforeStart'
                    ? t('validation.endBeforeStart')
                    : errors.semesterEnd.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              {mode === 'edit' && selectedId && selectedUniversity && selectedSemester && (
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
                          <AlertDialogTitle>{t('dialog.archiveUniversityTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('dialog.archiveUniversityConfirm')}
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
                                priority: 0,
                                semesterStart: '',
                                semesterEnd: '',
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
                        <AlertDialogTitle>{t('dialog.deleteUniversityTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('dialog.deleteUniversityConfirm')}
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
                              priority: 0,
                              semesterStart: '',
                              semesterEnd: '',
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
