import type { ReactNode } from 'react'

import { DataTable, type DataColumn } from './data-table'

export type ComparisonRow = {
  id: string
  metric: string
  values: Record<string, ReactNode>
}

type ComparisonTableProps = {
  entities: Array<{ key: string; label: string }>
  rows: ComparisonRow[]
}

export function ComparisonTable({ entities, rows }: ComparisonTableProps) {
  const columns: DataColumn<ComparisonRow>[] = [
    {
      key: 'metric',
      header: 'Metric',
      render: (row) => <span className="font-medium">{row.metric}</span>,
    },
    ...entities.map((entity) => ({
      key: entity.key,
      header: entity.label,
      align: 'right' as const,
      render: (row: ComparisonRow) => row.values[entity.key] ?? '-',
    })),
  ]

  return <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
}
