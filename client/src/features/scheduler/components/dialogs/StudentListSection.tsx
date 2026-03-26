import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { createStudentSchema, type StudentFormData } from '../../schemas/studentSchema'
import { addStudent, removeStudent, importStudents } from '../../api/scheduler.api'
import { ExcelDropZone } from './ExcelDropZone'
import type { Student, CreateStudentDto } from '../../types/scheduler.types'

interface StudentListSectionProps {
  assignmentId: number
  studentCount: number | null
  students: Student[]
}

const HE_TO_EN_MAP: Record<string, string> = {
  'שם פרטי': 'firstName',
  'שם משפחה': 'lastName',
  'ת.ז.': 'nationalId',
  'טלפון': 'phone',
  'אימייל': 'email',
}

function parseStudentRow(row: Record<string, unknown>): CreateStudentDto {
  return {
    firstName: String(row.firstName ?? ''),
    lastName: String(row.lastName ?? ''),
    nationalId: String(row.nationalId ?? ''),
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
  }
}

function normalizeStudentRow(
  row: Record<string, unknown>,
  headers: string[],
): Record<string, unknown> {
  const normalized = headers.map((h) => h.trim())
  const hebrewKeys = Object.keys(HE_TO_EN_MAP)
  const isHebrew = hebrewKeys.some((col) => normalized.includes(col))

  if (!isHebrew) return row

  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const trimmedKey = key.trim()
    const englishKey = HE_TO_EN_MAP[trimmedKey] ?? trimmedKey
    mapped[englishKey] = value
  }
  return mapped
}

function validateStudentColumns(headers: string[]): boolean {
  const normalized = headers.map((h) => h.trim())
  const requiredEN = ['firstName', 'lastName', 'nationalId']
  const requiredHE = ['שם פרטי', 'שם משפחה', 'ת.ז.']

  const hasEnglish = requiredEN.every((col) => normalized.includes(col))
  if (hasEnglish) return true

  const hasHebrew = requiredHE.every((col) => normalized.includes(col))
  return hasHebrew
}

export function StudentListSection({
  assignmentId,
  studentCount,
  students,
}: StudentListSectionProps) {
  const { t } = useTranslation('scheduler')
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const schema = useMemo(() => createStudentSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(schema),
  })

  const invalidateAssignment = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignment', assignmentId] })
    void queryClient.invalidateQueries({ queryKey: ['scheduler', 'assignments'] })
  }, [queryClient, assignmentId])

  const addMutation = useMutation({
    mutationFn: (dto: CreateStudentDto) => addStudent(assignmentId, dto),
    onSuccess: () => {
      invalidateAssignment()
      toast.success(t('toast.studentAdded'))
      reset()
      setShowAddForm(false)
    },
    onError: () => {
      toast.error(t('toast.importFailed'))
    },
  })

  const removeMutation = useMutation({
    mutationFn: (studentId: number) => removeStudent(assignmentId, studentId),
    onSuccess: () => {
      invalidateAssignment()
      toast.success(t('toast.studentRemoved'))
    },
    onError: () => {
      toast.error(t('toast.importFailed'))
    },
  })

  const importMutation = useMutation({
    mutationFn: (studentsData: CreateStudentDto[]) =>
      importStudents(assignmentId, studentsData),
    onSuccess: () => {
      invalidateAssignment()
      toast.success(t('toast.studentAdded'))
      setShowImport(false)
    },
    onError: () => {
      toast.error(t('toast.importFailed'))
    },
  })

  function onAddSubmit(data: StudentFormData) {
    addMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      nationalId: data.nationalId,
      phone: data.phone || null,
      email: data.email || null,
    })
  }

  const handleFileSelected = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

        if (jsonData.length === 0) {
          toast.error(t('dialogs.import.validationError'))
          return
        }

        const headers = Object.keys(jsonData[0])
        if (!validateStudentColumns(headers)) {
          toast.error(t('dialogs.import.validationError'))
          return
        }

        const parsed = jsonData.map((row) => {
          const normalized = normalizeStudentRow(row, headers)
          return parseStudentRow(normalized)
        })

        importMutation.mutate(parsed)
      } catch {
        toast.error(t('dialogs.import.validationError'))
      }
    },
    [importMutation, t],
  )

  const filled = students.length
  const total = studentCount ?? 0

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t('dialogs.students.title')}{' '}
          <span className="text-muted-foreground font-normal">
            ({t('dialogs.students.count', { filled, total })})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowImport((prev) => !prev)
              setShowAddForm(false)
            }}
          >
            <FileSpreadsheet className="size-4" />
            {t('dialogs.students.importExcel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddForm((prev) => !prev)
              setShowImport(false)
            }}
          >
            <Plus className="size-4" />
            {t('dialogs.students.addStudent')}
          </Button>
        </div>
      </div>

      {/* Import section */}
      {showImport && (
        <div className="rounded-md border p-3">
          <ExcelDropZone onFileSelected={handleFileSelected} />
        </div>
      )}

      {/* Student table */}
      {students.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dialogs.students.firstName')}</TableHead>
              <TableHead>{t('dialogs.students.lastName')}</TableHead>
              <TableHead>{t('dialogs.students.nationalId')}</TableHead>
              <TableHead>{t('dialogs.students.phone')}</TableHead>
              <TableHead>{t('dialogs.students.email')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.firstName}</TableCell>
                <TableCell>{student.lastName}</TableCell>
                <TableCell>{student.nationalId}</TableCell>
                <TableCell>{student.phone ?? '-'}</TableCell>
                <TableCell>{student.email ?? '-'}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-destructive hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(student.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Inline add form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(onAddSubmit)}
          className="rounded-md border p-3"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <fieldset className="flex flex-col gap-1">
              <Input
                placeholder={t('dialogs.students.firstName')}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <Input
                placeholder={t('dialogs.students.lastName')}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <Input
                placeholder={t('dialogs.students.nationalId')}
                {...register('nationalId')}
              />
              {errors.nationalId && (
                <p className="text-xs text-destructive">{errors.nationalId.message}</p>
              )}
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <Input
                placeholder={t('dialogs.students.phone')}
                {...register('phone')}
              />
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <Input
                placeholder={t('dialogs.students.email')}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </fieldset>
            <div className="flex items-start gap-2">
              <Button type="submit" size="sm" disabled={addMutation.isPending}>
                {t('dialogs.students.addStudent')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  reset()
                }}
              >
                {t('dialogs.manual.cancel')}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
