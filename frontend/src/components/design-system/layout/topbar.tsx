import type { ReactNode } from 'react'

import { VisuallyHidden } from '../foundation/a11y'
import { cn } from '../foundation/cn'

type TopbarProps = {
  searchPlaceholder?: string
  actions?: ReactNode
  className?: string
}

export function Topbar({
  searchPlaceholder = 'Search majors, faculties, or processes',
  actions,
  className,
}: TopbarProps) {
  return (
    <header className={cn('border-b border-primary/10 bg-surface/95 px-4 py-3 backdrop-blur md:px-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative w-full max-w-md">
          <VisuallyHidden>Search admissions analytics</VisuallyHidden>
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full rounded-card border border-primary/20 bg-background px-4 py-2 text-sm text-textPrimary placeholder:text-textSecondary/70 outline-none transition focus-visible:ring-2 focus-visible:ring-primary/60"
          />
        </label>

        <div className="flex items-center gap-2">
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
