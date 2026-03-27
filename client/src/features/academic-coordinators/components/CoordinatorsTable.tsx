import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CoordinatorDialog } from './CoordinatorDialog'
import type { Coordinator } from '../types/coordinator.types'
import type { CoordinatorFormValues } from '../schemas/coordinator.schemas'

interface CoordinatorsTableProps {
  coordinators: Coordinator[]
  onCreate: (data: CoordinatorFormValues) => void
  onUpdate: (id: number, data: CoordinatorFormValues) => void
  onDelete: (id: number) => void
  isCreatePending: boolean
  isUpdatePending: boolean
}

export function CoordinatorsTable({
  coordinators,
  onCreate,
  onUpdate,
  onDelete,
  isCreatePending,
  isUpdatePending,
}: CoordinatorsTableProps) {
  const { t } = useTranslation('coordinators')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null)

  function handleAdd() {
    setEditingCoordinator(null)
    setDialogOpen(true)
  }

  function handleEdit(coordinator: Coordinator) {
    setEditingCoordinator(coordinator)
    setDialogOpen(true)
  }

  function handleSubmit(data: CoordinatorFormValues) {
    if (editingCoordinator) {
      onUpdate(editingCoordinator.id, data)
    } else {
      onCreate(data)
    }
    setDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('pageTitle')}</CardTitle>
          <CardAction>
            <Button onClick={handleAdd} size="sm">
              <Plus className="size-4" />
              {t('actions.add')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.firstName')}</TableHead>
                <TableHead>{t('table.lastName')}</TableHead>
                <TableHead>{t('table.email')}</TableHead>
                <TableHead>{t('table.phone')}</TableHead>
                <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.firstName}</TableCell>
                  <TableCell>{c.lastName}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(c)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('dialog.deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('dialog.deleteConfirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(c.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('actions.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {coordinators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CoordinatorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coordinator={editingCoordinator}
        onSubmit={handleSubmit}
        isPending={editingCoordinator ? isUpdatePending : isCreatePending}
      />
    </>
  )
}
