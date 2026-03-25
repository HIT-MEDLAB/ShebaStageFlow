import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">{t('errors.notFound.title')}</h2>
      <p className="text-muted-foreground">
        {t('errors.notFound.description')}
      </p>
      <Button onClick={() => navigate('/home')} className="mt-2">
        {t('errors.notFound.goHome')}
      </Button>
    </div>
  )
}
