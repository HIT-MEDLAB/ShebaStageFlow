import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moveAssignment } from '../api/scheduler.api'
import type { Assignment, MoveAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useMoveAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MoveAssignmentDto }) =>
      moveAssignment(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel in-flight queries (partial key match works for cancel)
      await queryClient.cancelQueries({ queryKey: ['scheduler', 'assignments'] })

      // Snapshot ALL matching caches
      const previousEntries: [readonly unknown[], Assignment[] | undefined][] = []
      queryClient
        .getQueriesData<Assignment[]>({ queryKey: ['scheduler', 'assignments'] })
        .forEach(([key, queryData]) => {
          previousEntries.push([key, queryData])
        })

      // Optimistically update all matching caches
      queryClient.setQueriesData<Assignment[]>(
        { queryKey: ['scheduler', 'assignments'] },
        (old) =>
          old?.map((a) =>
            a.id === id
              ? {
                  ...a,
                  departmentId: data.departmentId,
                  startDate: data.startDate,
                  endDate: data.endDate,
                }
              : a,
          ),
      )
      return { previousEntries }
    },
    onError: (_err, _vars, context) => {
      // Rollback all caches
      context?.previousEntries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      toast.error(t('toast.moveFailed'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
    },
    onSuccess: () => {
      toast.success(t('toast.assignmentMoved'))
    },
  })
}
