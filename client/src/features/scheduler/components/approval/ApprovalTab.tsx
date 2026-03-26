import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { useApprovalAssignments } from '../../hooks/useApprovalActions'
import { ApprovalsTable } from './ApprovalsTable'
import type { AssignmentStatus } from '../../types/scheduler.types'

type StatusFilter = 'PENDING' | 'REJECTED' | 'ALL'

export function ApprovalTab() {
  const { t } = useTranslation('scheduler')
  const { academicYearId } = useSchedulerStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')

  const queryStatus: AssignmentStatus | AssignmentStatus[] | undefined =
    statusFilter === 'ALL' ? ['PENDING', 'REJECTED'] : statusFilter

  const { data: assignments, isLoading } = useApprovalAssignments(academicYearId, queryStatus)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">{t('approval.filterPending')}</SelectItem>
            <SelectItem value="REJECTED">{t('approval.filterRejected')}</SelectItem>
            <SelectItem value="ALL">{t('approval.filterAll')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ApprovalsTable assignments={assignments ?? []} />
      )}
    </div>
  )
}
