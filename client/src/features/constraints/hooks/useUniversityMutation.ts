import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  createUniversityWithSemester,
  updateUniversityWithSemester,
  deleteUniversity,
  setUniversityActive,
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
    mutationFn: ({ id, data, calendarYear }: { id: number; data: UpdateUniversityData; calendarYear?: number }) =>
      updateUniversityWithSemester(id, data, calendarYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.universityUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUniversity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.universityDeleted'))
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(t('toast.universityHasReferences'))
      } else {
        toast.error(t('toast.deleteFailed'))
      }
    },
  })

  const archiveMutation = useMutation({
    mutationFn: ({ id, isActive, year }: { id: number; isActive: boolean; year: number }) =>
      setUniversityActive(id, isActive, year),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'universities'] })
      toast.success(
        variables.isActive
          ? t('toast.universityUnarchived')
          : t('toast.universityArchived'),
      )
    },
    onError: () => {
      toast.error(t('toast.archiveFailed'))
    },
  })

  return { createMutation, updateMutation, deleteMutation, archiveMutation }
}
