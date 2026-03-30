import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SmartImportRow } from '../../../types/scheduler.types'

interface ImportRowEditFormProps {
  initialData: SmartImportRow
  onSave: (editedRow: SmartImportRow) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ImportRowEditForm({ initialData, onSave, onCancel, isLoading }: ImportRowEditFormProps) {
  const { t } = useTranslation('scheduler')
  const [form, setForm] = useState<SmartImportRow>({ ...initialData })

  function handleChange(field: keyof SmartImportRow, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 text-xs">
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.department')}</Label>
        <Input
          value={form.departmentName}
          onChange={(e) => handleChange('departmentName', e.target.value)}
          disabled={isLoading}
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.university')}</Label>
        <Input
          value={form.universityName}
          onChange={(e) => handleChange('universityName', e.target.value)}
          disabled={isLoading}
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.shift')}</Label>
        <Select
          value={form.shiftType}
          onValueChange={(v) => handleChange('shiftType', v)}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="בוקר">בוקר</SelectItem>
            <SelectItem value="אחה&quot;צ">אחה&quot;צ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.type')}</Label>
        <Select
          value={form.placementType}
          onValueChange={(v) => handleChange('placementType', v)}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="רגיל">רגיל</SelectItem>
            <SelectItem value="אלקטיב">אלקטיב</SelectItem>
            <SelectItem value="סבב ראשון">סבב ראשון</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.startDate')}</Label>
        <Input
          type="date"
          value={form.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          disabled={isLoading}
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.endDate')}</Label>
        <Input
          type="date"
          value={form.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          disabled={isLoading}
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.yearInProgram')}</Label>
        <Input
          type="number"
          value={form.yearInProgram}
          onChange={(e) => handleChange('yearInProgram', Number(e.target.value))}
          disabled={isLoading}
          className="h-7 text-xs"
          min={1}
          max={6}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t('dialogs.manual.studentCount')}</Label>
        <Input
          type="number"
          value={form.studentCount ?? ''}
          onChange={(e) => handleChange('studentCount', e.target.value ? Number(e.target.value) : null)}
          disabled={isLoading}
          className="h-7 text-xs"
          min={0}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-xs">{t('dialogs.manual.tutorName')}</Label>
        <Input
          value={form.tutorName ?? ''}
          onChange={(e) => handleChange('tutorName', e.target.value || null)}
          disabled={isLoading}
          className="h-7 text-xs"
        />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('dialogs.smartImport.cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-7 text-xs"
          disabled={isLoading}
        >
          {t('dialogs.smartImport.save')}
        </Button>
      </div>
    </form>
  )
}
