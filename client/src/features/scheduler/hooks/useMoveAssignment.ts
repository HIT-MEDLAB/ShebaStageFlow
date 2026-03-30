import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { moveAssignment } from '../api/scheduler.api'
import type { Assignment, MoveAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { invalidateConstraintsOn422 } from '../utils/invalidateOnConstraintError'

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
    onError: (err, _vars, context) => {
      // Rollback all caches
      context?.previousEntries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      invalidateConstraintsOn422(queryClient, err)
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const violations = err.response.data?.errors as { messageKey: string; params?: Record<string, string> }[] | undefined
        if (violations?.length) {
          violations.forEach((v) => toast.error(t(v.messageKey, v.params)))
          return
        }
      }
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
