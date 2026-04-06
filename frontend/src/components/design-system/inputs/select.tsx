import type { ChangeEventHandler } from 'react'

import { useI18n } from '../../../lib/i18n'
import type { SelectOption } from './types'

type SelectProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: ChangeEventHandler<HTMLSelectElement>
  placeholder?: string
  disabled?: boolean
}

export function Select({ label, value, options, onChange, placeholder, disabled }: SelectProps) {
  const { t } = useI18n()

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-textSecondary">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">{label}</span>
      <select
        className="w-full rounded-card border border-primary/20 bg-white px-3 py-2 text-sm text-textPrimary shadow-soft transition focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder || t('common.selectOption')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
