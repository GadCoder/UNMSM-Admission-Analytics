import type { ReactNode } from 'react'

import { cn } from '../foundation/cn'

type TopbarProps = {
  leading?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Topbar({ leading, actions, className }: TopbarProps) {
  return (
    <header className={cn('border-b border-primary/10 bg-surface/95 px-4 py-3 backdrop-blur md:px-6', className)}>
      <div className="flex items-center gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="ml-auto min-w-0">
          {actions ?? (
            <span className="rounded-card border border-primary/20 bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Global controls
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
