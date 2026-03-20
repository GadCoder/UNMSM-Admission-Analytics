import type { ReactNode } from 'react'

type EntityHeaderProps = {
  title: string
  subtitle?: string
  metadata?: string
  actions?: ReactNode
  icon?: ReactNode
}

export function EntityHeader({ title, subtitle, metadata, actions, icon }: EntityHeaderProps) {
  return (
    <header className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-card border border-primary/20 bg-background text-primaryDark">
            {icon ?? '🎓'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-textPrimary md:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-textSecondary">{subtitle}</p> : null}
            {metadata ? <p className="mt-2 text-xs uppercase tracking-[0.12em] text-textSecondary">{metadata}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
