import { useMemo, useState } from 'react'

import {
  ComparisonTable,
  InlineMetricBadge,
  MultiSelectSearch,
  SectionHeader,
  TableToolbar,
  TrendIndicator,
  type ComparisonRow,
  type SelectOption,
} from '../components/design-system'

const allEntityOptions: SelectOption[] = [
  { value: 'major-cs', label: 'Computer Science' },
  { value: 'major-se', label: 'Software Engineering' },
  { value: 'major-ds', label: 'Data Science' },
  { value: 'major-medicine', label: 'Medicine' },
  { value: 'major-law', label: 'Law' },
]

export function ComparePage() {
  const [selected, setSelected] = useState<SelectOption[]>([])
  const [search, setSearch] = useState('')

  const entities = selected.map((item) => ({ key: item.value, label: item.label }))

  const rows: ComparisonRow[] = useMemo(() => {
    const safeEntities = entities.length > 0 ? entities : [{ key: 'placeholder', label: 'Add entities' }]
    return [
      {
        id: 'applicants',
        metric: 'Applicants',
        values: Object.fromEntries(safeEntities.map((entry, index) => [entry.key, `${(index + 1) * 1200}`])),
      },
      {
        id: 'acceptance',
        metric: 'Acceptance Rate',
        values: Object.fromEntries(
          safeEntities.map((entry, index) => [
            entry.key,
            <InlineMetricBadge key={entry.key} value={`${24 - index * 2}%`} positive={index < 2} />,
          ])
        ),
      },
      {
        id: 'trend',
        metric: 'Trend',
        values: Object.fromEntries(
          safeEntities.map((entry, index) => [entry.key, <TrendIndicator key={entry.key} direction={index % 2 === 0 ? 'up' : 'down'} />])
        ),
      },
    ]
  }, [entities])

  return (
    <div className="space-y-5">
      <SectionHeader title="Compare" subtitle="Select multiple entities and evaluate metric differences side by side." />

      <MultiSelectSearch
        selected={selected}
        onChange={setSelected}
        loadOptions={async (query) => {
          const normalized = query.trim().toLowerCase()
          await new Promise((resolve) => setTimeout(resolve, 180))
          if (!normalized) {
            return allEntityOptions
          }
          return allEntityOptions.filter((entry) => entry.label.toLowerCase().includes(normalized))
        }}
      />

      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
        <TableToolbar search={search} onSearchChange={setSearch} />
        <ComparisonTable
          entities={entities.length > 0 ? entities : [{ key: 'placeholder', label: 'Selection required' }]}
          rows={rows.filter((row) => row.metric.toLowerCase().includes(search.toLowerCase()))}
        />
      </section>
    </div>
  )
}
