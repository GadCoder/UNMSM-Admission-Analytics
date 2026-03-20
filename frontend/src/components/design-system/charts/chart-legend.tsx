import type { ChartSeries } from './types'

export function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-3 text-xs text-textSecondary">
      {series.map((item) => (
        <li key={item.key} className="inline-flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
