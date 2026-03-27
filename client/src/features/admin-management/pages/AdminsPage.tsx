import { Navigate } from 'react-router-dom'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'
import { useAdmins } from '../hooks/useAdmins'
import { useAdminMutations } from '../hooks/useAdminMutations'
import { AdminsTable } from '../components/AdminsTable'

export function AdminsPage() {
  const isSuperAdmin = useIsSuperAdmin()
  const { data: admins = [] } = useAdmins()
  const { createMutation, updateMutation, deleteMutation } = useAdminMutations()

  if (!isSuperAdmin) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="p-6">
      <AdminsTable
        admins={admins}
        onCreate={(data) => createMutation.mutate(data)}
        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        onDelete={(id) => deleteMutation.mutate(id)}
        isCreatePending={createMutation.isPending}
        isUpdatePending={updateMutation.isPending}
      />
    </div>
  )
}
