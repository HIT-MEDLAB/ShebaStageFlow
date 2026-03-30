import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createUniversityWithSemester,
  updateUniversityWithSemester,
} from '../api/constraints.api'
import type { CreateUniversityData, UpdateUniversityData } from '../types/constraints.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useUniversityMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('constraints')

  const createMutation = useMutation({
    mutationFn: (data: CreateUniversityData) => createUniversityWithSemester(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.universityCreated'))
    },
    onError: () => {
      toast.error(t('toast.createFailed'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUniversityData }) =>
      updateUniversityWithSemester(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.universityUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  return { createMutation, updateMutation }
}
