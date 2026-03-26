import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, RotateCcw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Assignment } from '../../types/scheduler.types'
import { useApproveAssignment, useRevertToPending } from '../../hooks/useApprovalActions'
import { RejectDialog } from './RejectDialog'

interface ApprovalsTableProps {
  assignments: Assignment[]
}

function formatDateRange(start: string, end: string, locale: string) {
  const s = new Date(start)
  const e = new Date(end)
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-GB'
  const fmt = (d: Date) => d.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' })
  return `${fmt(s)} – ${fmt(e)}`
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const { t } = useTranslation('scheduler')
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    APPROVED: 'default',
    PENDING: 'secondary',
    REJECTED: 'destructive',
  }
  return <Badge variant={variants[status] ?? 'outline'}>{t(`status.${status.toLowerCase()}`)}</Badge>
}

export function ApprovalsTable({ assignments }: ApprovalsTableProps) {
  const { t, i18n } = useTranslation('scheduler')
  const approveMutation = useApproveAssignment()
  const revertMutation = useRevertToPending()
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  if (assignments.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('approval.empty')}</p>
  }

  function handleApprove(id: number) {
    setLoadingId(id)
    approveMutation.mutate(id, { onSettled: () => setLoadingId(null) })
  }

  function handleRevert(id: number) {
    setLoadingId(id)
    revertMutation.mutate(id, { onSettled: () => setLoadingId(null) })
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('approval.table.department')}</TableHead>
            <TableHead>{t('approval.table.university')}</TableHead>
            <TableHead>{t('approval.table.dates')}</TableHead>
            <TableHead>{t('approval.table.shift')}</TableHead>
            <TableHead>{t('approval.table.type')}</TableHead>
            <TableHead>{t('approval.table.status')}</TableHead>
            <TableHead>{t('approval.table.createdBy')}</TableHead>
            <TableHead>{t('approval.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.departmentName}</TableCell>
              <TableCell>{a.universityName}</TableCell>
              <TableCell>{formatDateRange(a.startDate, a.endDate, i18n.language)}</TableCell>
              <TableCell>{t(`filters.${a.shiftType.toLowerCase()}`)}</TableCell>
              <TableCell>{t(`card.${a.type.toLowerCase()}`)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <StatusBadge status={a.status} />
                  {a.status === 'REJECTED' && a.rejectionReason && (
                    <span className="text-xs text-muted-foreground">{a.rejectionReason}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{a.createdByName ?? '—'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {a.status === 'PENDING' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(a.id)}
                            disabled={loadingId === a.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('approval.actions.approve')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setRejectingId(a.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('approval.actions.reject')}</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  {a.status === 'REJECTED' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleRevert(a.id)}
                          disabled={loadingId === a.id}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('approval.actions.revertToPending')}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rejectingId !== null && (
        <RejectDialog
          open
          assignmentId={rejectingId}
          onClose={() => setRejectingId(null)}
        />
      )}
    </TooltipProvider>
  )
}
