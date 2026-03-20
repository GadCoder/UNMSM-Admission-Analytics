import { useState } from 'react'

import {
  Button,
  DataTable,
  EntityHeader,
  Pagination,
  RowActions,
  SectionHeader,
  TableToolbar,
  type DataColumn,
} from '../components/design-system'

type ApplicantRow = {
  id: string
  applicant: string
  score: number
  status: string
}

const baseRows: ApplicantRow[] = [
  { id: '1', applicant: 'Ana Torres', score: 91.3, status: 'Admitted' },
  { id: '2', applicant: 'Luis Ramos', score: 89.4, status: 'Waitlist' },
  { id: '3', applicant: 'Maria Vega', score: 87.8, status: 'Admitted' },
]

export function ResultsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const columns: DataColumn<ApplicantRow>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      render: (row) => row.applicant,
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      render: (row) => row.score.toFixed(1),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: () => (
        <RowActions
          actions={[
            <Button key="view" variant="ghost">
              View
            </Button>,
            <Button key="compare" variant="ghost">
              Compare
            </Button>,
          ]}
        />
      ),
    },
  ]

  const rows = baseRows.filter((row) => row.applicant.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <SectionHeader title="Entity Detail" subtitle="Canonical entity-detail integration using shared headers and tables." />
      <EntityHeader
        title="Computer Science"
        subtitle="Engineering Faculty / Engineering Area"
        metadata="Last updated: 2026-03-19"
        actions={
          <>
            <Button variant="secondary">Compare</Button>
            <Button variant="primary">Export</Button>
          </>
        }
      />

      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
        <TableToolbar search={search} onSearchChange={setSearch} />
        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
        <div className="mt-3">
          <Pagination page={page} totalPages={3} onPageChange={setPage} />
        </div>
      </section>
    </div>
  )
}
