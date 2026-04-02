import type { PropsWithChildren } from 'react'

import { cn } from '../foundation/cn'

type BadgeVariant = 'success' | 'danger' | 'neutral'

type BadgeProps = PropsWithChildren<{
  variant?: BadgeVariant
  className?: string
}>

const variantClassMap: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success border-success/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  neutral: 'bg-primary/10 text-primaryDark border-primary/20',
}

export function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em]',
        variantClassMap[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function InlineMetricBadge({ value, positive }: { value: string; positive: boolean }) {
  return <Badge variant={positive ? 'success' : 'danger'}>{value}</Badge>
}
