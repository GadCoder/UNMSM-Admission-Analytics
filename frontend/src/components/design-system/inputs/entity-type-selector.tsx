import { useI18n } from '../../../lib/i18n'
import { Select } from './select'
import type { SelectOption } from './types'

type EntityTypeSelectorProps = {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
}

export function EntityTypeSelector({ value, onChange, options }: EntityTypeSelectorProps) {
  const { t } = useI18n()

  const defaultEntityTypeOptions: SelectOption[] = [
    { value: 'major', label: t('results.major') },
    { value: 'faculty', label: t('admin.faculties.title') },
    { value: 'area', label: t('common.area') },
  ]

  return (
    <Select
      label={t('analytics.entityType')}
      value={value}
      options={options ?? defaultEntityTypeOptions}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
