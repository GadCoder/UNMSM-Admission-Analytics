import { useMemo, useState } from 'react'

import { cn } from '../foundation/cn'

export type HierarchicalNode = {
  id: string
  label: string
  children?: HierarchicalNode[]
}

type HierarchicalSidebarProps = {
  title?: string
  groups: HierarchicalNode[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function HierarchicalSidebar({ title = 'Explore Hierarchy', groups, selectedId, onSelect }: HierarchicalSidebarProps) {
  const defaultExpanded = useMemo(() => groups.map((group) => group.id), [groups])
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpanded)

  const toggle = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
  }

  return (
    <aside className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primaryDark">{title}</h3>
      <div className="mt-4 space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedIds.includes(group.id)
          return (
            <section key={group.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-card px-2 py-2 text-left text-sm font-semibold text-textPrimary hover:bg-primary/5"
                onClick={() => toggle(group.id)}
              >
                <span>{group.label}</span>
                <span className="text-xs text-textSecondary">{isExpanded ? '−' : '+'}</span>
              </button>

              {isExpanded ? (
                <div className="mt-1 space-y-1 pl-2">
                  {group.children?.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.id)}
                      className={cn(
                        'flex w-full items-center rounded-card px-2 py-1.5 text-left text-sm transition',
                        selectedId === child.id
                          ? 'bg-primary/12 font-medium text-primaryDark'
                          : 'text-textSecondary hover:bg-primary/5 hover:text-textPrimary'
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </aside>
  )
}
