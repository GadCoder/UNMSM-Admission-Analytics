import { NavLink } from 'react-router-dom'

import { cn } from '../foundation/cn'

export type SidebarNavItem = {
  label: string
  path: string
  short: string
}

export type SidebarNavGroup = {
  label: string
  items: SidebarNavItem[]
}

type SidebarProps = {
  title: string
  subtitle: string
  groups: SidebarNavGroup[]
  navAriaLabel?: string
  className?: string
}

export function Sidebar({ title, subtitle, groups, navAriaLabel = 'Primary', className }: SidebarProps) {
  return (
    <aside className={cn('hidden w-72 shrink-0 border-r border-primary/10 bg-surface px-4 py-6 md:block', className)}>
      <div className="mb-8 px-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{subtitle}</p>
        <h1 className="mt-2 text-lg font-semibold text-textPrimary">{title}</h1>
      </div>

      <nav aria-label={navAriaLabel} className="space-y-4">
        {groups.map((group) => (
          <section key={group.label}>
            <p className="mb-2 px-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-textSecondary/80">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-card px-3 py-2 text-sm font-medium outline-none transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                      isActive
                        ? 'bg-primary/12 text-primaryDark shadow-soft'
                        : 'text-textSecondary hover:bg-primary/6 hover:text-textPrimary',
                    ].join(' ')
                  }
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/15 bg-background text-[0.65rem] font-semibold tracking-wide">
                    {item.short}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  )
}
