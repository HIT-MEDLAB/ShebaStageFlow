import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UniversityRow } from '../types/home.types'

interface UniversityTableProps {
  rows: UniversityRow[]
}

export function UniversityTable({ rows }: UniversityTableProps) {
  const { t } = useTranslation('home')

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
          <TableHead className="font-bold text-foreground text-center">{t('table.institutionName')}</TableHead>
          <TableHead className="font-bold text-foreground text-center">{t('table.totalStudents')}</TableHead>
          <TableHead className="font-bold text-foreground text-center">{t('table.morningRotations')}</TableHead>
          <TableHead className="font-bold text-foreground text-center">{t('table.eveningRotations')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
              {t('table.noData')}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-accent/50 transition-colors border-b border-border">
              <TableCell className="font-medium text-foreground text-center">{row.name}</TableCell>
              <TableCell className="text-muted-foreground text-center">{row.totalStudents.toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground text-center">{row.morningRotations}</TableCell>
              <TableCell className="text-muted-foreground text-center">{row.eveningRotations}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
