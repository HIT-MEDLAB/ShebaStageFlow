import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { fetchAssignments, approveAssignment, rejectAssignment, updateAssignment } from '../api/scheduler.api'
import type { AssignmentStatus } from '../types/scheduler.types'

export function useApprovalAssignments(
  academicYearId: number | null,
  statusFilter: AssignmentStatus | AssignmentStatus[] | undefined,
) {
  return useQuery({
    queryKey: ['scheduler', 'assignments', 'approval', academicYearId, statusFilter],
    queryFn: () => fetchAssignments(academicYearId!, undefined, statusFilter),
    enabled: !!academicYearId,
  })
}

export function useApproveAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (id: number) => approveAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('approval.toast.approved'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })
}

export function useRejectAssignment() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason?: string }) =>
      rejectAssignment(id, rejectionReason ? { rejectionReason } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('approval.toast.rejected'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })
}

export function useRevertToPending() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (id: number) => updateAssignment(id, { status: 'PENDING' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('approval.toast.revertedToPending'))
    },
    onError: () => {
      toast.error(t('toast.updateFailed'))
    },
  })
}
