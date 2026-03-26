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
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConstraintToggle } from './ConstraintToggle'
import { SoftConstraintDialog } from './SoftConstraintDialog'
import type { SoftConstraint, DepartmentWithConstraint, UniversityWithSemester } from '../types/constraints.types'
import type { SoftConstraintFormValues } from '../schemas/constraints.schemas'

interface SoftConstraintsTableProps {
  softConstraints: SoftConstraint[]
  departments: DepartmentWithConstraint[]
  universities: UniversityWithSemester[]
  isAdmin: boolean
  onToggle: (id: number, isActive: boolean) => void
  onCreate: (data: SoftConstraintFormValues) => void
  onUpdate: (id: number, data: SoftConstraintFormValues) => void
  onDelete: (id: number) => void
  isCreatePending: boolean
  isUpdatePending: boolean
}

export function SoftConstraintsTable({
  softConstraints,
  departments,
  universities,
  isAdmin,
  onToggle,
  onCreate,
  onUpdate,
  onDelete,
  isCreatePending,
  isUpdatePending,
}: SoftConstraintsTableProps) {
  const { t } = useTranslation('constraints')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConstraint, setEditingConstraint] = useState<SoftConstraint | null>(null)

  function handleAdd() {
    setEditingConstraint(null)
    setDialogOpen(true)
  }

  function handleEdit(constraint: SoftConstraint) {
    setEditingConstraint(constraint)
    setDialogOpen(true)
  }

  function handleSubmit(data: SoftConstraintFormValues) {
    if (editingConstraint) {
      onUpdate(editingConstraint.id, data)
    } else {
      onCreate(data)
    }
    setDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('tabs.soft')}</CardTitle>
          {isAdmin && (
            <CardAction>
              <Button onClick={handleAdd} size="sm">
                <Plus className="size-4" />
                {t('actions.addSoft')}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.name')}</TableHead>
            <TableHead>{t('table.description')}</TableHead>
            <TableHead>{t('table.priority')}</TableHead>
            <TableHead>{t('table.scope')}</TableHead>
            <TableHead className="w-[100px]">{t('table.status')}</TableHead>
            {isAdmin && <TableHead className="w-[100px]">{t('table.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {softConstraints.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.description}</TableCell>
              <TableCell>
                <Badge variant="secondary">{c.priority}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {c.department?.name ?? t('form.allDepartments')}
                {' / '}
                {c.university?.name ?? t('form.allUniversities')}
              </TableCell>
              <TableCell>
                <ConstraintToggle
                  checked={c.isActive}
                  disabled={!isAdmin}
                  onToggle={(checked) => onToggle(c.id, checked)}
                />
              </TableCell>
              {isAdmin && (
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
              )}
            </TableRow>
          ))}

          {softConstraints.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                {t('table.noConstraints')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
        </CardContent>
      </Card>

      <SoftConstraintDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        constraint={editingConstraint}
        departments={departments}
        universities={universities}
        onSubmit={handleSubmit}
        isPending={editingConstraint ? isUpdatePending : isCreatePending}
      />
    </>
  )
}
