import { useI18n } from '../../../lib/i18n'
import { Select } from './select'
import type { SelectOption } from './types'

type DateRangeSelectorProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
}

export function DateRangeSelector({ value, onChange, options }: DateRangeSelectorProps) {
  const { t } = useI18n()

  return (
    <Select
      label={t('analytics.dateRange')}
      value={value}
      options={options}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t('filters.section.allYears')}
    />
  )
}
