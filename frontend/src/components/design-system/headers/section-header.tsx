import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold text-textPrimary md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-textSecondary md:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
