import { cn } from '../foundation/cn'

export type TrendDirection = 'up' | 'down' | 'neutral'

export function TrendIndicator({ direction, value }: { direction: TrendDirection; value?: string }) {
  const icon = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold',
        direction === 'up' && 'text-success',
        direction === 'down' && 'text-danger',
        direction === 'neutral' && 'text-textSecondary'
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {value ?? direction}
    </span>
  )
}
