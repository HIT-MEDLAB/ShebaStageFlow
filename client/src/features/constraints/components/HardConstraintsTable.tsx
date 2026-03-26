import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConstraintToggle } from './ConstraintToggle'
import type { IronConstraint, DateConstraint, Holiday } from '../types/constraints.types'

interface HardConstraintsTableProps {
  ironConstraints: IronConstraint[]
  dateConstraints: DateConstraint[]
  holidays: Holiday[]
  isAdmin: boolean
  onToggleIron: (id: number, isActive: boolean) => void
  onToggleDate: (id: number, isActive: boolean) => void
  onToggleHoliday: (id: number, isActive: boolean) => void
}

export function HardConstraintsTable({
  ironConstraints,
  dateConstraints,
  holidays,
  isAdmin,
  onToggleIron,
  onToggleDate,
  onToggleHoliday,
}: HardConstraintsTableProps) {
  const { t } = useTranslation('constraints')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tabs.hard')}</CardTitle>
      </CardHeader>
      <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.name')}</TableHead>
          <TableHead>{t('table.description')}</TableHead>
          <TableHead>{t('table.type')}</TableHead>
          <TableHead className="w-[100px]">{t('table.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ironConstraints.map((c) => (
          <TableRow key={`iron-${c.id}`}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>{c.description}</TableCell>
            <TableCell>{t('types.iron')}</TableCell>
            <TableCell>
              <ConstraintToggle
                checked={c.isActive}
                disabled={!isAdmin}
                onToggle={(checked) => onToggleIron(c.id, checked)}
              />
            </TableCell>
          </TableRow>
        ))}

        {dateConstraints.map((c) => (
          <TableRow key={`date-${c.id}`}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>
              {c.description}
              <span className="block text-xs text-muted-foreground">
                {format(new Date(c.startDate), 'dd/MM/yyyy')} – {format(new Date(c.endDate), 'dd/MM/yyyy')}
              </span>
            </TableCell>
            <TableCell>{t('types.date')}</TableCell>
            <TableCell>
              <ConstraintToggle
                checked={c.isActive}
                disabled={!isAdmin}
                onToggle={(checked) => onToggleDate(c.id, checked)}
              />
            </TableCell>
          </TableRow>
        ))}

        {holidays.map((h) => (
          <TableRow key={`holiday-${h.id}`}>
            <TableCell className="font-medium">{h.name}</TableCell>
            <TableCell>
              {format(new Date(h.date), 'dd/MM/yyyy')}
              <span className="text-xs text-muted-foreground ms-2">
                {h.isFullDay ? t('holiday.fullDay') : t('holiday.partialDay')}
              </span>
            </TableCell>
            <TableCell>{t('types.holiday')}</TableCell>
            <TableCell>
              <ConstraintToggle
                checked={h.isActive}
                disabled={!isAdmin}
                onToggle={(checked) => onToggleHoliday(h.id, checked)}
              />
            </TableCell>
          </TableRow>
        ))}

        {ironConstraints.length === 0 && dateConstraints.length === 0 && holidays.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              {t('table.noConstraints')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
      </CardContent>
    </Card>
  )
}
