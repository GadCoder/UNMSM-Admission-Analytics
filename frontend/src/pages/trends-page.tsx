import { useState } from 'react'

import {
  AnalyticsFilterBar,
  ChartCard,
  ChartLegend,
  InlineAnnotation,
  LineChartAdapter,
  SectionHeader,
  TrendSummaryCard,
  type ChartPoint,
  type ChartSeries,
  type SelectOption,
} from '../components/design-system'
import { useI18n } from '../lib/i18n'

const dateRangeOptions: SelectOption[] = [
  { value: '2020-2024', label: '2020-2024' },
  { value: '2022-2026', label: '2022-2026' },
]

const data: ChartPoint[] = [
  { x: '2022', cs: 84, se: 80 },
  { x: '2023', cs: 85, se: 81 },
  { x: '2024', cs: 87, se: 82 },
  { x: '2025', cs: 88, se: 83 },
]

export function TrendsPage() {
  const { t } = useI18n()

  const metricOptions: SelectOption[] = [
    { value: 'cutoff', label: t('trends.metric.cutoff') },
    { value: 'applicants', label: t('trends.metric.applicants') },
    { value: 'admitted', label: t('trends.metric.admitted') },
  ]

  const series: ChartSeries[] = [
    { key: 'cs', label: t('trends.entity.computerScience'), color: '#8f5658' },
    { key: 'se', label: t('trends.entity.softwareEngineering'), color: '#2e8b57' },
  ]

  const [entityType, setEntityType] = useState('major')
  const [metric, setMetric] = useState('cutoff')
  const [dateRange, setDateRange] = useState('2022-2026')
  const [entitySearch, setEntitySearch] = useState('')

  return (
    <div className="space-y-5">
      <SectionHeader title={t('trends.title')} subtitle={t('trends.subtitle')} />

      <AnalyticsFilterBar
        entityType={entityType}
        metric={metric}
        dateRange={dateRange}
        entitySearch={entitySearch}
        metricOptions={metricOptions}
        dateRangeOptions={dateRangeOptions}
        onEntityTypeChange={setEntityType}
        onMetricChange={setMetric}
        onDateRangeChange={setDateRange}
        onEntitySearchChange={setEntitySearch}
      />

      <ChartCard title={t('trends.chart.multiSeries')} actions={<InlineAnnotation label={metric.toUpperCase()} />}>
        <LineChartAdapter data={data} series={series} />
        <div className="mt-3">
          <ChartLegend series={series} />
        </div>
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-3">
        <TrendSummaryCard
          title={t('trends.card.biggestIncrease')}
          value={t('trends.entity.computerScience')}
          description={t('trends.card.increaseDescription')}
          direction="up"
        />
        <TrendSummaryCard
          title={t('trends.card.biggestDecrease')}
          value={t('trends.entity.economics')}
          description={t('trends.card.decreaseDescription')}
          direction="down"
        />
        <TrendSummaryCard
          title={t('trends.card.mostStable')}
          value={t('trends.entity.softwareEngineering')}
          description={t('trends.card.stableDescription')}
          direction="neutral"
        />
      </div>
    </div>
  )
}
