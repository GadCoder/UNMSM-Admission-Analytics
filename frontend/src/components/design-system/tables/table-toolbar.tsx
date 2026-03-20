import type { ReactNode } from 'react'

type TableToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  actions?: ReactNode
}

export function TableToolbar({ search, onSearchChange, actions }: TableToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search rows"
        className="w-full max-w-sm rounded-card border border-primary/20 bg-background px-3 py-2 text-sm text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      />
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
