import { Navigate } from 'react-router-dom'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useCoordinators } from '../hooks/useCoordinators'
import { useCoordinatorMutations } from '../hooks/useCoordinatorMutations'
import { CoordinatorsTable } from '../components/CoordinatorsTable'

export function CoordinatorsPage() {
  const isAdmin = useIsAdmin()
  const { data: coordinators = [] } = useCoordinators()
  const { createMutation, updateMutation, deleteMutation } = useCoordinatorMutations()

  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="p-6">
      <CoordinatorsTable
        coordinators={coordinators}
        onCreate={(data) => createMutation.mutate(data)}
        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        onDelete={(id) => deleteMutation.mutate(id)}
        isCreatePending={createMutation.isPending}
        isUpdatePending={updateMutation.isPending}
      />
    </div>
  )
}
