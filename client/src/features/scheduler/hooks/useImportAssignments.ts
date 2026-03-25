import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importAssignments } from '../api/scheduler.api'
import type { CreateAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useImportAssignments() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (assignments: CreateAssignmentDto[]) =>
      importAssignments(assignments),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.importSuccess', { count: variables.length }))
    },
    onError: () => {
      toast.error(t('toast.importFailed'))
    },
  })
}
