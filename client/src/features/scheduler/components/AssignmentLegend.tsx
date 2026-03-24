import { useTranslation } from 'react-i18next'

export function AssignmentLegend() {
  const { t } = useTranslation('scheduler')

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
      <span className="font-medium text-foreground">{t('legend.title')}:</span>

      {/* Assignment types */}
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-[#BF3069]" />
        {t('legend.group')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-[#44C2A4]" />
        {t('legend.elective')}
      </span>

      {/* Status indicators */}
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-full border-2 border-foreground bg-foreground" />
        {t('legend.approved')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-full border-2 border-dashed border-foreground" />
        {t('legend.pending')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-full border-2 border-foreground bg-foreground opacity-40" />
        {t('legend.rejected')}
      </span>

      {/* Blocked */}
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-muted-foreground/40" />
        {t('legend.blocked')}
      </span>
    </div>
  )
}
