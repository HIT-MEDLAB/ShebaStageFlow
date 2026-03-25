import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axios from 'axios'
import {
  fetchUniversities,
  fetchUniversitySemesters,
  createSemester,
  updateSemester,
} from '../api/constraints.api'

export function useUniversities() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: fetchUniversities,
  })
}

export function useUniversitySemesters(universityId: number | null) {
  return useQuery({
    queryKey: ['constraints', 'semesters', universityId],
    queryFn: () => fetchUniversitySemesters(universityId!),
    enabled: universityId !== null,
  })
}

export function useCreateSemester() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { universityId: number; semesterStart: string; semesterEnd: string }) =>
      createSemester(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'semesters'] })
      toast.success(t('toast.semesterSaved'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.semesterSaved')
      toast.error(message)
    },
  })
}

export function useUpdateSemester() {
  const { t } = useTranslation('constraints')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { semesterStart?: string; semesterEnd?: string }
    }) => updateSemester(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints', 'semesters'] })
      toast.success(t('toast.semesterSaved'))
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('toast.semesterSaved')
      toast.error(message)
    },
  })
}
