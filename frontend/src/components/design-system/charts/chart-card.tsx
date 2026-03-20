import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function ChartCard({ title, actions, children }: ChartCardProps) {
  return (
    <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primaryDark">{title}</h3>
        {actions}
      </header>
      {children}
    </section>
  )
}
