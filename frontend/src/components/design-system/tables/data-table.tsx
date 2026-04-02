import type { ReactNode } from 'react'

import { cn } from '../foundation/cn'

export type DataColumn<Row> = {
  key: string
  header: string
  align?: 'left' | 'right'
  render: (row: Row) => ReactNode
}

type DataTableProps<Row> = {
  columns: DataColumn<Row>[]
  rows: Row[]
  getRowKey: (row: Row) => string
}

export function DataTable<Row>({ columns, rows, getRowKey }: DataTableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded-card border border-primary/10 bg-surface shadow-soft">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-primary/10 bg-background/60">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-textSecondary',
                  column.align === 'right' ? 'text-right' : 'text-left'
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-primary/5 last:border-none">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-3 py-2 text-sm text-textPrimary', column.align === 'right' ? 'text-right' : 'text-left')}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
