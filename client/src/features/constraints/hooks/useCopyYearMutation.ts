import { useMutation, useQueryClient } from '@tanstack/react-query'
import { copyConstraintsToYear } from '../api/constraints.api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useCopyYearMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('constraints')

  return useMutation({
    mutationFn: ({ targetAcademicYearId, sourceAcademicYearId }: { targetAcademicYearId: number; sourceAcademicYearId: number }) =>
      copyConstraintsToYear(targetAcademicYearId, sourceAcademicYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'constraints'] })
      toast.success(t('toast.yearCopied'))
    },
    onError: () => {
      toast.error(t('toast.copyYearFailed'))
    },
  })
}
