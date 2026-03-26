import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAssignment } from '../api/scheduler.api'
import type { CreateAssignmentDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (data: CreateAssignmentDto) => createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.assignmentCreated'))
    },
    onError: () => {
      toast.error(t('toast.createFailed'))
    },
  })
}
