import { useTranslation } from 'react-i18next'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Label,
} from 'recharts'
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart'
import type { DepartmentCapacityPercentage } from '../types/statistics.types'

interface DepartmentCapacityPercentageChartProps {
  data: DepartmentCapacityPercentage[]
}

function getGaugeColor(percentage: number): string {
  if (percentage >= 90) return '#ef4444'
  if (percentage >= 70) return '#eab308'
  return '#22c55e'
}

export function DepartmentCapacityPercentageChart({ data }: DepartmentCapacityPercentageChartProps) {
  const { t } = useTranslation('statistics')

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((dept) => {
        const color = getGaugeColor(dept.percentage)
        const chartConfig: ChartConfig = {
          percentage: {
            label: t('labels.capacityPercentage'),
            color,
          },
        }
        const chartData = [{ percentage: dept.percentage, fill: color }]

        return (
          <div key={dept.departmentId} className="flex flex-col items-center gap-1">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[100px]"
            >
              <RadialBarChart
                data={chartData}
                startAngle={90}
                endAngle={-270}
                innerRadius={35}
                outerRadius={50}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="percentage"
                  background
                  cornerRadius={10}
                  angleAxisId={0}
                />
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-lg font-bold"
                          >
                            {dept.percentage}%
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </RadialBarChart>
            </ChartContainer>
            <span className="text-xs text-muted-foreground text-center">
              {dept.departmentName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
