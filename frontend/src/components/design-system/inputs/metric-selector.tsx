import { Select } from './select'
import { cn } from '../foundation/cn'
import type { SelectOption } from './types'

type MetricSelectorProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  variant?: 'select' | 'segmented'
}

export function MetricSelector({ value, onChange, options, variant = 'select' }: MetricSelectorProps) {
  if (variant === 'segmented') {
    return (
      <div className="inline-flex items-center rounded-card border border-primary/20 bg-white p-1 shadow-soft" role="tablist" aria-label="Metric selector">
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                'rounded-card px-3 py-1.5 text-xs font-semibold transition',
                isActive ? 'bg-primary text-white' : 'text-textSecondary hover:bg-primary/8 hover:text-primaryDark'
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return <Select label="Metric" value={value} options={options} onChange={(event) => onChange(event.target.value)} />
}
