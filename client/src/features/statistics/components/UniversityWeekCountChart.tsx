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
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="universityName"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="weekCount"
          fill="var(--color-weekCount)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
