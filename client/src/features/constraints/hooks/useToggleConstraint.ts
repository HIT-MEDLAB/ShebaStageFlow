import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  toggleIronConstraint,
  toggleDateConstraint,
  toggleSoftConstraint,
  toggleHoliday,
} from '../api/constraints.api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useToggleConstraint() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('constraints')

  const ironMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleIronConstraint(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const dateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleDateConstraint(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const softMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleSoftConstraint(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  const holidayMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleHoliday(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.constraintUpdated'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })

  return { ironMutation, dateMutation, softMutation, holidayMutation }
}
