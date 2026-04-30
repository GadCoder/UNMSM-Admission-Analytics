import { useI18n } from '../../../lib/i18n'
import type { SelectOption } from '../inputs/types'
import { DateRangeSelector } from '../inputs/date-range-selector'
import { EntityTypeSelector } from '../inputs/entity-type-selector'
import { MetricSelector } from '../inputs/metric-selector'

type AnalyticsFilterBarProps = {
  entityType: string
  metric: string
  dateRange: string
  entitySearch: string
  metricOptions: SelectOption[]
  dateRangeOptions: SelectOption[]
  onEntityTypeChange: (value: string) => void
  onMetricChange: (value: string) => void
  onDateRangeChange: (value: string) => void
  onEntitySearchChange: (value: string) => void
}

export function AnalyticsFilterBar({
  entityType,
  metric,
  dateRange,
  entitySearch,
  metricOptions,
  dateRangeOptions,
  onEntityTypeChange,
  onMetricChange,
  onDateRangeChange,
  onEntitySearchChange,
}: AnalyticsFilterBarProps) {
  const { t } = useI18n()

  return (
    <section className="rounded-card border border-primary/15 bg-surface p-4 shadow-soft md:p-5" aria-label={t('filters.analytics')}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <EntityTypeSelector value={entityType} onChange={onEntityTypeChange} />
        <label className="flex flex-col gap-2 text-sm text-textSecondary">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">{t('analytics.entitySearch')}</span>
          <input
            value={entitySearch}
            onChange={(event) => onEntitySearchChange(event.target.value)}
            placeholder={t('common.searchEntities')}
            className="w-full rounded-card border border-primary/20 bg-white px-3 py-2 text-sm text-textPrimary shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          />
        </label>
        <MetricSelector value={metric} onChange={onMetricChange} options={metricOptions} />
        <DateRangeSelector value={dateRange} onChange={onDateRangeChange} options={dateRangeOptions} />
      </div>
    </section>
  )
}
