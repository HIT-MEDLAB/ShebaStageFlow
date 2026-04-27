import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { createBlock, moveBlock, detachFromBlock, findBlockPositions, convertToBlock } from '../api/scheduler.api'
import type { CreateBlockDto, MoveBlockDto, FindBlockPositionsDto, ConvertToBlockDto } from '../types/scheduler.types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { invalidateConstraintsOn422 } from '../utils/invalidateOnConstraintError'

export function useCreateBlock() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (data: CreateBlockDto) => createBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.blockCreated'))
    },
    onError: (err) => {
      invalidateConstraintsOn422(queryClient, err)
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const violations = err.response.data?.errors as { messageKey: string; params?: Record<string, string> }[] | undefined
        if (violations?.length) {
          violations.forEach((v) => toast.error(t(v.messageKey, v.params)))
          return
        }
      }
      toast.error(t('toast.createFailed'))
    },
  })
}

export function useConvertToBlock() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: number; data: ConvertToBlockDto }) =>
      convertToBlock(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignment'] })
      toast.success(t('toast.blockCreated'))
    },
    onError: (err) => {
      invalidateConstraintsOn422(queryClient, err)
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const violations = err.response.data?.errors as { messageKey: string; params?: Record<string, string> }[] | undefined
        if (violations?.length) {
          violations.forEach((v) => toast.error(t(v.messageKey, v.params)))
          return
        }
      }
      toast.error(t('toast.updateFailed'))
    },
  })
}

export function useMoveBlock() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: MoveBlockDto }) =>
      moveBlock(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.blockMoved'))
    },
    onError: (err) => {
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
  })
}

export function useDetachFromBlock() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (assignmentId: number) => detachFromBlock(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
      toast.success(t('toast.detachedFromBlock'))
    },
    onError: () => {
      toast.error(t('toast.detachFailed'))
    },
  })
}

export function useFindBlockPositions() {
  const { t } = useTranslation('scheduler')

  return useMutation({
    mutationFn: (dto: FindBlockPositionsDto) => findBlockPositions(dto),
    onError: () => {
      toast.error(t('toast.findPositionsFailed'))
    },
  })
}
