import { Select } from './select'
import type { SelectOption } from './types'

type DateRangeSelectorProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
}

export function DateRangeSelector({ value, onChange, options }: DateRangeSelectorProps) {
  return (
    <Select
      label="Date Range"
      value={value}
      options={options}
      onChange={(event) => onChange(event.target.value)}
      placeholder="All years"
    />
  )
}
