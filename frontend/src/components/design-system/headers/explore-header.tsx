import type { ReactNode } from 'react'

type ExploreHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
}

export function ExploreHeader({ title, description, actions }: ExploreHeaderProps) {
  return (
    <header className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-textPrimary">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-textSecondary md:text-base">{description}</p>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
