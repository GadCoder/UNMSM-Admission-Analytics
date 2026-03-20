import { ChartCard } from './chart-card'

type HistogramCardProps = {
  title: string
  cutoff: string
  median: string
  max: string
}

export function HistogramCard({ title, cutoff, median, max }: HistogramCardProps) {
  return (
    <ChartCard title={title}>
      <div className="rounded-card border border-primary/10 bg-background p-4">
        <div className="h-28 rounded-card bg-gradient-to-r from-primary/10 to-primary/25" />
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-textSecondary">
          <div>
            <dt className="uppercase tracking-[0.1em]">Cutoff</dt>
            <dd className="mt-1 font-semibold text-textPrimary">{cutoff}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.1em]">Median</dt>
            <dd className="mt-1 font-semibold text-textPrimary">{median}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.1em]">Max</dt>
            <dd className="mt-1 font-semibold text-textPrimary">{max}</dd>
          </div>
        </dl>
      </div>
    </ChartCard>
  )
}
