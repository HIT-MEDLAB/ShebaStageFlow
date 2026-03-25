import { useTranslation } from 'react-i18next'
import { HardConstraintsCard } from '../components/HardConstraintsCard'
import { TemporalConstraintsCard } from '../components/TemporalConstraintsCard'
import { InstitutionalRulesCard } from '../components/InstitutionalRulesCard'

export function ConstraintsPage() {
  const { t } = useTranslation('constraints')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>
      <HardConstraintsCard />
      <TemporalConstraintsCard />
      <InstitutionalRulesCard />
    </div>
  )
}
