import { useQuery } from '@tanstack/react-query'
import { fetchDepartments, fetchDepartmentConstraint } from '../api/constraints.api'

export function useDepartments() {
  return useQuery({
    queryKey: ['constraints', 'departments'],
    queryFn: fetchDepartments,
  })
}

export function useDepartmentConstraint(departmentId: number | null) {
  return useQuery({
    queryKey: ['constraints', 'departments', departmentId],
    queryFn: () => fetchDepartmentConstraint(departmentId!),
    enabled: departmentId !== null,
  })
}
