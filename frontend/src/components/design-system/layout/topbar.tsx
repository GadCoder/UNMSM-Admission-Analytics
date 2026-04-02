import type { ReactNode } from 'react'

import { cn } from '../foundation/cn'

type TopbarProps = {
  actions?: ReactNode
  className?: string
}

export function Topbar({ actions, className }: TopbarProps) {
  return (
    <header className={cn('border-b border-primary/10 bg-surface/95 px-4 py-3 backdrop-blur md:px-6', className)}>
      <div className="flex items-center justify-end">
        {actions ?? (
          <span className="rounded-card border border-primary/20 bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Global controls
          </span>
        )}
      </div>
    </header>
  )
}
