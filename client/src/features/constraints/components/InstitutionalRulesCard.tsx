import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, GraduationCap } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DepartmentConfigDialog } from './DepartmentConfigDialog'
import { UniversitySemesterDialog } from './UniversitySemesterDialog'

export function InstitutionalRulesCard() {
  const { t } = useTranslation('constraints')
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [universityDialogOpen, setUniversityDialogOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('institutional.title')}</CardTitle>
            <CardDescription>{t('institutional.subtitle')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center rounded-lg border p-6 text-center">
              <Building2 className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="font-semibold">{t('institutional.departments.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('institutional.departments.description')}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setDepartmentDialogOpen(true)}
              >
                {t('institutional.departments.button')}
              </Button>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-6 text-center">
              <GraduationCap className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="font-semibold">{t('institutional.university.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('institutional.university.description')}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setUniversityDialogOpen(true)}
              >
                {t('institutional.university.button')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DepartmentConfigDialog
        open={departmentDialogOpen}
        onClose={() => setDepartmentDialogOpen(false)}
      />

      <UniversitySemesterDialog
        open={universityDialogOpen}
        onClose={() => setUniversityDialogOpen(false)}
      />
    </>
  )
}
