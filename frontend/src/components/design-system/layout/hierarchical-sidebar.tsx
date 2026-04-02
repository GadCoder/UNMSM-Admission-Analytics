import { useEffect, useMemo, useState } from 'react'

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
  const defaultExpanded = useMemo(() => {
    const expanded: string[] = []

    const traverse = (nodes: HierarchicalNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          expanded.push(node.id)
          traverse(node.children)
        }
      })
    }

    traverse(groups)
    return expanded
  }, [groups])
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpanded)

  useEffect(() => {
    setExpandedIds((current) => [...new Set([...current, ...defaultExpanded])])
  }, [defaultExpanded])

  const toggle = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
  }

  const renderNode = (node: HierarchicalNode, depth: number) => {
    const hasChildren = Boolean(node.children && node.children.length > 0)
    const isExpanded = expandedIds.includes(node.id)

    return (
      <div key={node.id}>
        <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 10}px` }}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            className={cn(
              'flex flex-1 items-center rounded-card px-2 py-1.5 text-left text-sm transition',
              selectedId === node.id ? 'bg-primary/12 font-medium text-primaryDark' : 'text-textSecondary hover:bg-primary/5 hover:text-textPrimary'
            )}
          >
            {node.label}
          </button>

          {hasChildren ? (
            <button
              type="button"
              className="rounded-card px-2 py-1 text-xs text-textSecondary hover:bg-primary/5"
              onClick={() => toggle(node.id)}
              aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : null}
        </div>

        {hasChildren && isExpanded ? (
          <div className="mt-1 space-y-1">{node.children?.map((child) => renderNode(child, depth + 1))}</div>
        ) : null}
      </div>
    )
  }

  return (
    <aside className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primaryDark">{title}</h3>
      <div className="mt-4 space-y-3">
        {groups.map((group) => renderNode(group, 0))}
      </div>
    </aside>
  )
}
