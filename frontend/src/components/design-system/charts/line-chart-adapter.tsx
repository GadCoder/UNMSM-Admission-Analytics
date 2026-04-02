import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartLegend } from './chart-legend'
import type { ChartPoint, ChartSeries } from './types'

type AxisDomainValue = number | 'auto' | 'dataMin' | 'dataMax'

type LineChartAdapterProps = {
  data: ChartPoint[]
  series: ChartSeries[]
  yAxisDomain?: [AxisDomainValue, AxisDomainValue]
  showLegend?: boolean
  showEndLabels?: boolean
}

export function LineChartAdapter({
  data,
  series,
  yAxisDomain = [0, 'auto'],
  showLegend = false,
  showEndLabels = false,
}: LineChartAdapterProps) {
  const lastDataIndex = Math.max(0, data.length - 1)

  return (
    <div className="w-full">
      <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: showEndLabels ? 40 : 24, bottom: 8, left: -12 }}>
          <CartesianGrid stroke="rgba(143,86,88,0.16)" strokeDasharray="3 3" />
          <XAxis dataKey="x" stroke="#6e5e5f" fontSize={12} padding={{ left: 4, right: 24 }} />
          <YAxis stroke="#6e5e5f" fontSize={12} domain={yAxisDomain} />
          <Tooltip />
          {series.map((entry) => (
            <Line
              key={entry.key}
              type="monotone"
              dataKey={entry.key}
              name={entry.label}
              stroke={entry.color}
              strokeWidth={2}
              dot={false}
              label={
                showEndLabels
                  ? ({ index, x, y, value }: { index?: number; x?: number; y?: number; value?: string | number }) => {
                      if (index !== lastDataIndex || value === null || value === undefined || x === undefined || y === undefined) {
                        return <></>
                      }
                      return (
                        <text x={x + 8} y={y} fill={entry.color} fontSize={11} fontWeight={600} dominantBaseline="middle">
                          {entry.label}
                        </text>
                      )
                    }
                  : undefined
              }
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
      {showLegend ? (
        <div className="mt-3">
          <ChartLegend series={series} />
        </div>
      ) : null}
    </div>
  )
}
