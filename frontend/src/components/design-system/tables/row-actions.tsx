import type { ReactNode } from 'react'

type RowActionsProps = {
  actions: ReactNode[]
}

export function RowActions({ actions }: RowActionsProps) {
  return <div className="flex items-center justify-end gap-2">{actions}</div>
}
