import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { UniversityWeekCount } from '../types/statistics.types'

interface UniversityWeekCountChartProps {
  data: UniversityWeekCount[]
}

export function UniversityWeekCountChart({ data }: UniversityWeekCountChartProps) {
  const { t } = useTranslation('statistics')

  const chartConfig: ChartConfig = {
    weekCount: {
      label: t('labels.weekCount'),
      color: '#8b5cf6',
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} layout="vertical" accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          dataKey="universityName"
          type="category"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="weekCount"
          fill="var(--color-weekCount)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
