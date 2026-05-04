import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { DepartmentScheduledWeeks } from '../types/statistics.types'

interface DepartmentScheduledWeeksChartProps {
  data: DepartmentScheduledWeeks[]
}

export function DepartmentScheduledWeeksChart({ data }: DepartmentScheduledWeeksChartProps) {
  const { t } = useTranslation('statistics')

  const chartConfig: ChartConfig = {
    scheduledWeeks: {
      label: t('labels.scheduledWeeks'),
      color: '#3b82f6',
    },
  }

  const chartWidth = data.length * 100

  return (
    <div className="overflow-x-auto">
      <ChartContainer config={chartConfig} className="h-[300px] w-full" style={{ minWidth: chartWidth }}>
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="departmentName"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="scheduledWeeks"
            fill="var(--color-scheduledWeeks)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
