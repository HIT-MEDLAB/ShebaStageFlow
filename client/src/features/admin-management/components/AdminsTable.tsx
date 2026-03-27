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
import { AdminDialog } from './AdminDialog'
import type { Admin } from '../types/admin.types'
import type { AdminFormValues } from '../schemas/admin.schemas'

interface AdminsTableProps {
  admins: Admin[]
  onCreate: (data: AdminFormValues) => void
  onUpdate: (id: number, data: AdminFormValues) => void
  onDelete: (id: number) => void
  isCreatePending: boolean
  isUpdatePending: boolean
}

export function AdminsTable({
  admins,
  onCreate,
  onUpdate,
  onDelete,
  isCreatePending,
  isUpdatePending,
}: AdminsTableProps) {
  const { t } = useTranslation('admins')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)

  function handleAdd() {
    setEditingAdmin(null)
    setDialogOpen(true)
  }

  function handleEdit(admin: Admin) {
    setEditingAdmin(admin)
    setDialogOpen(true)
  }

  function handleSubmit(data: AdminFormValues) {
    if (editingAdmin) {
      onUpdate(editingAdmin.id, data)
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
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.firstName}</TableCell>
                  <TableCell>{a.lastName}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.phone ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(a)}
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
                              onClick={() => onDelete(a.id)}
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

              {admins.length === 0 && (
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

      <AdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        admin={editingAdmin}
        onSubmit={handleSubmit}
        isPending={editingAdmin ? isUpdatePending : isCreatePending}
      />
    </>
  )
}
