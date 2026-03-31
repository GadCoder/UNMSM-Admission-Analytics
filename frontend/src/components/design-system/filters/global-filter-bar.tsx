import type { ReactNode } from 'react'

import { Select } from '../inputs/select'
import type { SelectOption } from '../inputs/types'

type GlobalFilterBarProps = {
  processId: string
  year: string
  academicAreaId: string
  processOptions: SelectOption[]
  yearOptions: SelectOption[]
  areaOptions: SelectOption[]
  processDisabled?: boolean
  onProcessChange: (value: string) => void
  onYearChange: (value: string) => void
  onAreaChange: (value: string) => void
  resetAction?: ReactNode
}

export function GlobalFilterBar({
  processId,
  year,
  academicAreaId,
  processOptions,
  yearOptions,
  areaOptions,
  processDisabled = false,
  onProcessChange,
  onYearChange,
  onAreaChange,
  resetAction,
}: GlobalFilterBarProps) {
  return (
    <section className="rounded-card border border-primary/15 bg-surface p-4 shadow-soft md:p-5" aria-label="Global filters">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <Select label="Year" value={year} options={yearOptions} placeholder="All years" onChange={(event) => onYearChange(event.target.value)} />
        <Select
          label="Process"
          value={processId}
          options={processOptions}
          placeholder={processDisabled ? 'Select year first' : 'All processes'}
          disabled={processDisabled}
          onChange={(event) => onProcessChange(event.target.value)}
        />
        <Select
          label="Academic Area"
          value={academicAreaId}
          options={areaOptions}
          placeholder="All areas"
          onChange={(event) => onAreaChange(event.target.value)}
        />
        {resetAction ? <div className="md:pb-[1px]">{resetAction}</div> : null}
      </div>
    </section>
  )
}
