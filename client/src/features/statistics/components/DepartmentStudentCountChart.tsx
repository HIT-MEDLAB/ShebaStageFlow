import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { DepartmentStudentCount } from '../types/statistics.types'

interface DepartmentStudentCountChartProps {
  data: DepartmentStudentCount[]
}

export function DepartmentStudentCountChart({ data }: DepartmentStudentCountChartProps) {
  const { t } = useTranslation('statistics')

  const chartConfig: ChartConfig = {
    studentCount: {
      label: t('labels.studentCount'),
      color: '#0ea5e9',
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
          dataKey="studentCount"
          fill="var(--color-studentCount)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
