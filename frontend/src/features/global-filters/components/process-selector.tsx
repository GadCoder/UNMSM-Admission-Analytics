import type { FilterOption } from '../api/filter-option-types'

type ProcessSelectorProps = {
  value: string | null
  onChange: (nextValue: string | null) => void
  options: FilterOption[]
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

export function ProcessSelector({ value, onChange, options, isLoading, isError, errorMessage }: ProcessSelectorProps) {
  const selectedLabel = value ? options.find((option) => option.value === value)?.label ?? value : 'All processes'

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-textSecondary">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">📅 Admission Process</span>
      <select
        className="w-full rounded-card border border-primary/35 bg-white px-3 py-2 text-sm font-semibold text-primaryDark shadow-soft transition focus:border-primary focus:outline-none"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={isLoading || isError}
      >
        <option value="">All processes</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="text-xs text-textSecondary">Selected: <span className="font-semibold text-textPrimary">{selectedLabel}</span></span>
      {isLoading ? <span className="text-xs text-textSecondary">Loading process options...</span> : null}
      {isError && errorMessage ? <span className="text-xs text-danger">{errorMessage}</span> : null}
    </label>
  )
}
