import { Select } from './select'
import type { SelectOption } from './types'

type MetricSelectorProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
}

export function MetricSelector({ value, onChange, options }: MetricSelectorProps) {
  return <Select label="Metric" value={value} options={options} onChange={(event) => onChange(event.target.value)} />
}
