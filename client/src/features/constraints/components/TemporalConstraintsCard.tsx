import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useDateConstraints } from '../hooks/useDateConstraints'
import {
  useUpdateDateConstraint,
  useDeleteDateConstraint,
} from '../hooks/useDateConstraintMutations'
import { AddEditDateConstraintDialog } from './AddEditDateConstraintDialog'
import { DeleteConstraintDialog } from './DeleteConstraintDialog'
import type { DateConstraint } from '../types/constraints.types'

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TemporalConstraintsCard() {
  const { t, i18n } = useTranslation('constraints')
  const isAdmin = useIsAdmin()
  const { data: constraints, isLoading } = useDateConstraints()
  const updateMutation = useUpdateDateConstraint()
  const deleteMutation = useDeleteDateConstraint()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingConstraint, setEditingConstraint] = useState<DateConstraint | null>(null)
  const [deletingConstraint, setDeletingConstraint] = useState<DateConstraint | null>(null)

  const handleToggle = (constraint: DateConstraint) => {
    updateMutation.mutate({ id: constraint.id, data: { isActive: !constraint.isActive } })
  }

  const handleDelete = () => {
    if (deletingConstraint) {
      deleteMutation.mutate(deletingConstraint.id, {
        onSuccess: () => setDeletingConstraint(null),
      })
    }
  }

  const colCount = isAdmin ? 6 : 5

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('temporalConstraints.title')}</CardTitle>
            <CardDescription>{t('temporalConstraints.subtitle')}</CardDescription>
          </div>
          {isAdmin && (
            <CardAction>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                {t('temporalConstraints.addButton')}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                <TableHead className="font-bold text-center">
                  {t('temporalConstraints.columns.eventName')}
                </TableHead>
                <TableHead className="font-bold text-center">
                  {t('temporalConstraints.columns.description')}
                </TableHead>
                <TableHead className="font-bold text-center">
                  {t('temporalConstraints.columns.startDate')}
                </TableHead>
                <TableHead className="font-bold text-center">
                  {t('temporalConstraints.columns.endDate')}
                </TableHead>
                <TableHead className="font-bold text-center">
                  {t('temporalConstraints.columns.status')}
                </TableHead>
                {isAdmin && (
                  <TableHead className="font-bold text-center">
                    {t('temporalConstraints.columns.actions')}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8">
                    ...
                  </TableCell>
                </TableRow>
              ) : !constraints?.length ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">
                    {t('temporalConstraints.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                constraints.map((constraint) => (
                  <TableRow
                    key={constraint.id}
                    className={`hover:bg-accent/50 transition-colors ${!constraint.isActive ? 'opacity-50' : ''}`}
                  >
                    <TableCell className="text-center font-medium">{constraint.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {constraint.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(constraint.startDate, i18n.language)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(constraint.endDate, i18n.language)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={constraint.isActive}
                        onCheckedChange={() => handleToggle(constraint)}
                        disabled={!isAdmin}
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingConstraint(constraint)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingConstraint(constraint)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddEditDateConstraintDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />

      <AddEditDateConstraintDialog
        open={!!editingConstraint}
        onClose={() => setEditingConstraint(null)}
        constraint={editingConstraint}
      />

      <DeleteConstraintDialog
        open={!!deletingConstraint}
        onClose={() => setDeletingConstraint(null)}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
