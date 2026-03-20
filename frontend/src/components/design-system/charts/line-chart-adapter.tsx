import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { ChartPoint, ChartSeries } from './types'

type LineChartAdapterProps = {
  data: ChartPoint[]
  series: ChartSeries[]
}

export function LineChartAdapter({ data, series }: LineChartAdapterProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 8, left: -12 }}>
          <CartesianGrid stroke="rgba(143,86,88,0.16)" strokeDasharray="3 3" />
          <XAxis dataKey="x" stroke="#6e5e5f" fontSize={12} />
          <YAxis stroke="#6e5e5f" fontSize={12} />
          <Tooltip />
          {series.map((entry) => (
            <Line key={entry.key} type="monotone" dataKey={entry.key} stroke={entry.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
