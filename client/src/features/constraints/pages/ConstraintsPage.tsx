import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAcademicYears } from '@/features/scheduler/hooks/useAcademicYears'
import { getCurrentAcademicYearName } from '@/features/scheduler/utils/getCurrentAcademicYearName'
import { useAllConstraints } from '../hooks/useAllConstraints'
import { useToggleConstraint } from '../hooks/useToggleConstraint'
import { useSoftConstraintMutations } from '../hooks/useSoftConstraintMutations'
import { useDepartmentMutation } from '../hooks/useDepartmentMutation'
import { useUniversityMutation } from '../hooks/useUniversityMutation'
import { useCopyYearMutation } from '../hooks/useCopyYearMutation'
import { HardConstraintsTable } from '../components/HardConstraintsTable'
import { SoftConstraintsTable } from '../components/SoftConstraintsTable'
import { DepartmentCard } from '../components/DepartmentCard'
import { UniversityCard } from '../components/UniversityCard'
import type { SoftConstraintFormValues, DepartmentFormValues, UniversityFormValues } from '../schemas/constraints.schemas'

export function ConstraintsPage() {
  const { t } = useTranslation('constraints')
  const isAdmin = useIsAdmin()
  const { data: academicYears } = useAcademicYears()

  // Auto-select current academic year
  const currentYearName = getCurrentAcademicYearName()
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null)

  useEffect(() => {
    if (academicYears && !selectedAcademicYearId) {
      const current = academicYears.find((y) => y.name === currentYearName)
      if (current) {
        setSelectedAcademicYearId(current.id)
      } else if (academicYears.length > 0) {
        setSelectedAcademicYearId(academicYears[0].id)
      }
    }
  }, [academicYears, currentYearName, selectedAcademicYearId])

  const selectedAcademicYear = academicYears?.find((y) => y.id === selectedAcademicYearId)
  const calendarYear = selectedAcademicYear
    ? new Date(selectedAcademicYear.startDate).getUTCFullYear()
    : undefined

  const { data, isLoading } = useAllConstraints(
    selectedAcademicYearId ?? undefined,
    calendarYear,
  )
  const { ironMutation, dateMutation, softMutation, holidayMutation } = useToggleConstraint()
  const { createMutation, updateMutation, deleteMutation } = useSoftConstraintMutations()
  const departmentMutation = useDepartmentMutation()
  const universityMutation = useUniversityMutation()
  const copyYearMutation = useCopyYearMutation()

  // Check if there are any configs for the selected year
  const hasConfigs = useMemo(() => {
    if (!data) return true
    const hasDeptConfigs = data.departments.some((d) => d.departmentConstraints.length > 0)
    const hasUniConfigs = data.universities.some((u) => u.semesters.length > 0)
    return hasDeptConfigs || hasUniConfigs
  }, [data])

  // Find previous academic year for copy
  const previousAcademicYear = useMemo(() => {
    if (!academicYears || !selectedAcademicYearId) return null
    const sorted = [...academicYears].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    const currentIdx = sorted.findIndex((y) => y.id === selectedAcademicYearId)
    return currentIdx >= 0 && currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null
  }, [academicYears, selectedAcademicYearId])

  if (!academicYears) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (academicYears.length === 0) {
    return (
      <div className="flex flex-col gap-6 h-full overflow-auto">
        <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('yearSelector.noYears')}</p>
      </div>
    )
  }

  if (!selectedAcademicYearId) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!data) return null

  function handleCreateSoft(formData: SoftConstraintFormValues) {
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      priority: formData.priority,
      departmentId: formData.departmentId,
      universityId: formData.universityId,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    })
  }

  function handleUpdateSoft(id: number, formData: SoftConstraintFormValues) {
    updateMutation.mutate({
      id,
      data: {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        departmentId: formData.departmentId,
        universityId: formData.universityId,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      },
    })
  }

  function handleCreateDepartment(formData: DepartmentFormValues) {
    if (!selectedAcademicYearId) return
    departmentMutation.createMutation.mutate({
      ...formData,
      academicYearId: selectedAcademicYearId,
    })
  }

  function handleUpdateDepartment(id: number, formData: DepartmentFormValues) {
    if (!selectedAcademicYearId) return
    departmentMutation.updateMutation.mutate({
      id,
      data: { ...formData, academicYearId: selectedAcademicYearId },
    })
  }

  function handleCreateUniversity(formData: UniversityFormValues) {
    universityMutation.createMutation.mutate({ data: formData, calendarYear })
  }

  function handleUpdateUniversity(id: number, formData: UniversityFormValues) {
    universityMutation.updateMutation.mutate({ id, data: formData, calendarYear })
  }

  function handleDeleteDepartment(id: number) {
    departmentMutation.deleteMutation.mutate(id)
  }

  function handleDeleteUniversity(id: number) {
    universityMutation.deleteMutation.mutate(id)
  }

  function handleArchiveDepartment(id: number, isActive: boolean) {
    if (!selectedAcademicYearId) return
    departmentMutation.archiveMutation.mutate({ id, isActive, academicYearId: selectedAcademicYearId })
  }

  function handleArchiveUniversity(id: number, isActive: boolean) {
    if (!calendarYear) {
      toast.error(t('toast.archiveFailed'))
      return
    }
    universityMutation.archiveMutation.mutate({ id, isActive, year: calendarYear })
  }

  function handleCopyFromPreviousYear() {
    if (!selectedAcademicYearId || !previousAcademicYear) return
    copyYearMutation.mutate({
      targetAcademicYearId: selectedAcademicYearId,
      sourceAcademicYearId: previousAcademicYear.id,
    })
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
        <div className="flex items-center gap-3">
          <Label>{t('yearSelector.label')}</Label>
          <Select
            value={selectedAcademicYearId?.toString() ?? ''}
            onValueChange={(val) => setSelectedAcademicYearId(Number(val))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (
                <SelectItem key={y.id} value={y.id.toString()}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasConfigs && isAdmin && previousAcademicYear && (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground flex-1">
            {t('yearSelector.noConfig')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromPreviousYear}
            disabled={copyYearMutation.isPending}
          >
            <Copy className="size-4 me-2" />
            {t('yearSelector.copyFromPrevious')} ({previousAcademicYear.name})
          </Button>
        </div>
      )}

      <Tabs defaultValue="hard">
        <TabsList>
          <TabsTrigger value="hard">{t('tabs.hard')}</TabsTrigger>
          <TabsTrigger value="soft">{t('tabs.soft')}</TabsTrigger>
        </TabsList>

        <TabsContent value="hard" className="mt-4">
          <HardConstraintsTable
            ironConstraints={data.ironConstraints}
            dateConstraints={data.dateConstraints}
            holidays={data.holidays}
            isAdmin={isAdmin}
            onToggleIron={(id, isActive) => ironMutation.mutate({ id, isActive })}
            onToggleDate={(id, isActive) => dateMutation.mutate({ id, isActive })}
            onToggleHoliday={(id, isActive, blocksWeek) => holidayMutation.mutate({ id, isActive, blocksWeek })}
          />
        </TabsContent>

        <TabsContent value="soft" className="mt-4">
          <SoftConstraintsTable
            softConstraints={data.softConstraints}
            departments={data.departments}
            universities={data.universities}
            isAdmin={isAdmin}
            onToggle={(id, isActive, blocksWeek) => softMutation.mutate({ id, isActive, blocksWeek })}
            onCreate={handleCreateSoft}
            onUpdate={handleUpdateSoft}
            onDelete={(id) => deleteMutation.mutate(id)}
            isCreatePending={createMutation.isPending}
            isUpdatePending={updateMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentCard
          departments={data.departments}
          isAdmin={isAdmin}
          academicYearId={selectedAcademicYearId}
          onCreate={handleCreateDepartment}
          onUpdate={handleUpdateDepartment}
          onDelete={handleDeleteDepartment}
          onArchive={handleArchiveDepartment}
          isCreatePending={departmentMutation.createMutation.isPending}
          isUpdatePending={departmentMutation.updateMutation.isPending}
          isDeletePending={departmentMutation.deleteMutation.isPending}
          isArchivePending={departmentMutation.archiveMutation.isPending}
        />
        <UniversityCard
          universities={data.universities}
          isAdmin={isAdmin}
          calendarYear={calendarYear}
          onCreate={handleCreateUniversity}
          onUpdate={handleUpdateUniversity}
          onDelete={handleDeleteUniversity}
          onArchive={handleArchiveUniversity}
          isCreatePending={universityMutation.createMutation.isPending}
          isUpdatePending={universityMutation.updateMutation.isPending}
          isDeletePending={universityMutation.deleteMutation.isPending}
          isArchivePending={universityMutation.archiveMutation.isPending}
        />
      </div>
    </div>
  )
}
