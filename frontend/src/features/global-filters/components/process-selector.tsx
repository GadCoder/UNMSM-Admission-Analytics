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

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-textSecondary">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">Admission Process</span>
        <select
          className="w-full rounded-card border border-primary/20 bg-white px-3 py-2 text-sm text-textPrimary shadow-soft transition focus:border-primary focus:outline-none"
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
      {isLoading ? <span className="text-xs text-textSecondary">Loading process options...</span> : null}
      {isError && errorMessage ? <span className="text-xs text-danger">{errorMessage}</span> : null}
    </label>
  )
}
