import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAllConstraints } from '../hooks/useAllConstraints'
import { useToggleConstraint } from '../hooks/useToggleConstraint'
import { useSoftConstraintMutations } from '../hooks/useSoftConstraintMutations'
import { useDepartmentMutation } from '../hooks/useDepartmentMutation'
import { useUniversityMutation } from '../hooks/useUniversityMutation'
import { HardConstraintsTable } from '../components/HardConstraintsTable'
import { SoftConstraintsTable } from '../components/SoftConstraintsTable'
import { DepartmentCard } from '../components/DepartmentCard'
import { UniversityCard } from '../components/UniversityCard'
import type { SoftConstraintFormValues, DepartmentFormValues, UniversityFormValues } from '../schemas/constraints.schemas'

export function ConstraintsPage() {
  const { t } = useTranslation('constraints')
  const isAdmin = useIsAdmin()
  const { data, isLoading } = useAllConstraints()
  const { ironMutation, dateMutation, softMutation, holidayMutation } = useToggleConstraint()
  const { createMutation, updateMutation, deleteMutation } = useSoftConstraintMutations()
  const departmentMutation = useDepartmentMutation()
  const universityMutation = useUniversityMutation()

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
    departmentMutation.createMutation.mutate(formData)
  }

  function handleUpdateDepartment(id: number, formData: DepartmentFormValues) {
    departmentMutation.updateMutation.mutate({ id, data: formData })
  }

  function handleCreateUniversity(formData: UniversityFormValues) {
    universityMutation.createMutation.mutate(formData)
  }

  function handleUpdateUniversity(id: number, formData: UniversityFormValues) {
    universityMutation.updateMutation.mutate({ id, data: formData })
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-auto">
      <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>

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
            onToggleHoliday={(id, isActive) => holidayMutation.mutate({ id, isActive })}
          />
        </TabsContent>

        <TabsContent value="soft" className="mt-4">
          <SoftConstraintsTable
            softConstraints={data.softConstraints}
            departments={data.departments}
            universities={data.universities}
            isAdmin={isAdmin}
            onToggle={(id, isActive) => softMutation.mutate({ id, isActive })}
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
          onCreate={handleCreateDepartment}
          onUpdate={handleUpdateDepartment}
          isCreatePending={departmentMutation.createMutation.isPending}
          isUpdatePending={departmentMutation.updateMutation.isPending}
        />
        <UniversityCard
          universities={data.universities}
          isAdmin={isAdmin}
          onCreate={handleCreateUniversity}
          onUpdate={handleUpdateUniversity}
          isCreatePending={universityMutation.createMutation.isPending}
          isUpdatePending={universityMutation.updateMutation.isPending}
        />
      </div>
    </div>
  )
}
