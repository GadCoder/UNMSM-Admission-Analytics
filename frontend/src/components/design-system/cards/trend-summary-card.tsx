import { TrendIndicator, type TrendDirection } from '../primitives/trend-indicator'

type TrendSummaryCardProps = {
  title: string
  description: string
  value: string
  direction: TrendDirection
}

export function TrendSummaryCard({ title, description, value, direction }: TrendSummaryCardProps) {
  return (
    <article className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">{title}</p>
      <p className="mt-1 text-lg font-semibold text-textPrimary">{value}</p>
      <div className="mt-2">
        <TrendIndicator direction={direction} />
      </div>
      <p className="mt-2 text-sm text-textSecondary">{description}</p>
    </article>
  )
}
