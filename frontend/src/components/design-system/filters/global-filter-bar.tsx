import type { ReactNode } from 'react'

import { useI18n } from '../../../lib/i18n'
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
  const { t } = useI18n()

  return (
    <section className="rounded-card border border-primary/15 bg-surface p-4 shadow-soft md:p-5" aria-label={t('filters.global')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <Select label={t('filters.section.year')} value={year} options={yearOptions} placeholder={t('filters.section.allYears')} onChange={(event) => onYearChange(event.target.value)} />
        <Select
          label={t('filters.section.process')}
          value={processId}
          options={processOptions}
          placeholder={processDisabled ? t('filters.section.selectYearFirst') : t('filters.section.allProcesses')}
          disabled={processDisabled}
          onChange={(event) => onProcessChange(event.target.value)}
        />
        <Select
          label={t('filters.section.academicArea')}
          value={academicAreaId}
          options={areaOptions}
          placeholder={t('filters.section.allAreas')}
          onChange={(event) => onAreaChange(event.target.value)}
        />
        {resetAction ? <div className="md:pb-[1px]">{resetAction}</div> : null}
      </div>
    </section>
  )
}
