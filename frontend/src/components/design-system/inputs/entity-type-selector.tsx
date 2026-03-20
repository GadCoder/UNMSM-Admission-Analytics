import { Select } from './select'
import type { SelectOption } from './types'

type EntityTypeSelectorProps = {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
}

const defaultEntityTypeOptions: SelectOption[] = [
  { value: 'major', label: 'Major' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'area', label: 'Area' },
]

export function EntityTypeSelector({ value, onChange, options = defaultEntityTypeOptions }: EntityTypeSelectorProps) {
  return <Select label="Entity Type" value={value} options={options} onChange={(event) => onChange(event.target.value)} />
}
