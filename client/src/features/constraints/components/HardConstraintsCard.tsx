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
import { useIronConstraints } from '../hooks/useIronConstraints'
import {
  useUpdateIronConstraint,
  useDeleteIronConstraint,
} from '../hooks/useIronConstraintMutations'
import { AddEditIronConstraintDialog } from './AddEditIronConstraintDialog'
import { DeleteConstraintDialog } from './DeleteConstraintDialog'
import type { IronConstraint } from '../types/constraints.types'

export function HardConstraintsCard() {
  const { t } = useTranslation('constraints')
  const isAdmin = useIsAdmin()
  const { data: constraints, isLoading } = useIronConstraints()
  const updateMutation = useUpdateIronConstraint()
  const deleteMutation = useDeleteIronConstraint()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingConstraint, setEditingConstraint] = useState<IronConstraint | null>(null)
  const [deletingConstraint, setDeletingConstraint] = useState<IronConstraint | null>(null)

  const handleToggle = (constraint: IronConstraint) => {
    updateMutation.mutate({ id: constraint.id, data: { isActive: !constraint.isActive } })
  }

  const handleDelete = () => {
    if (deletingConstraint) {
      deleteMutation.mutate(deletingConstraint.id, {
        onSuccess: () => setDeletingConstraint(null),
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('hardConstraints.title')}</CardTitle>
            <CardDescription>{t('hardConstraints.subtitle')}</CardDescription>
          </div>
          {isAdmin && (
            <CardAction>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                {t('hardConstraints.addButton')}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                <TableHead className="font-bold text-center">
                  {t('hardConstraints.columns.ruleName')}
                </TableHead>
                <TableHead className="font-bold text-center">
                  {t('hardConstraints.columns.description')}
                </TableHead>
                <TableHead className="font-bold text-center">
                  {t('hardConstraints.columns.status')}
                </TableHead>
                {isAdmin && (
                  <TableHead className="font-bold text-center">
                    {t('hardConstraints.columns.actions')}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8">
                    ...
                  </TableCell>
                </TableRow>
              ) : !constraints?.length ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    {t('hardConstraints.noData')}
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

      <AddEditIronConstraintDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />

      <AddEditIronConstraintDialog
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
