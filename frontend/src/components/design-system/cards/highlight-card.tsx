import type { ReactNode } from 'react'

import { cn } from '../foundation/cn'

type HighlightVariant = 'primary' | 'secondary'

type HighlightCardProps = {
  title: string
  value: string
  description?: string
  variant?: HighlightVariant
  accessory?: ReactNode
}

export function HighlightCard({ title, value, description, variant = 'secondary', accessory }: HighlightCardProps) {
  return (
    <article
      className={cn(
        'rounded-card border p-4 shadow-soft',
        variant === 'primary' ? 'border-primary/35 bg-primary/10' : 'border-primary/10 bg-surface'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.12em] text-primaryDark">{title}</p>
        {accessory}
      </div>
      <p className="mt-2 text-xl font-semibold text-textPrimary">{value}</p>
      {description ? <p className="mt-1 text-sm text-textSecondary">{description}</p> : null}
    </article>
  )
}
