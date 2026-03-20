import type { ReactNode } from 'react'

type InsightItem = {
  icon?: ReactNode
  label: string
  description: string
}

type InsightPanelProps = {
  title: string
  items: InsightItem[]
  cta?: ReactNode
}

export function InsightPanel({ title, items, cta }: InsightPanelProps) {
  return (
    <aside className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primaryDark">{title}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <span className="mt-0.5 text-primaryDark">{item.icon ?? '•'}</span>
            <div>
              <p className="text-sm font-medium text-textPrimary">{item.label}</p>
              <p className="text-sm text-textSecondary">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </aside>
  )
}
