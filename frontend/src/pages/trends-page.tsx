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

const metricOptions: SelectOption[] = [
  { value: 'cutoff', label: 'Cutoff Score' },
  { value: 'applicants', label: 'Applicants' },
  { value: 'admitted', label: 'Admitted' },
]

const dateRangeOptions: SelectOption[] = [
  { value: '2020-2024', label: '2020-2024' },
  { value: '2022-2026', label: '2022-2026' },
]

const series: ChartSeries[] = [
  { key: 'cs', label: 'Computer Science', color: '#8f5658' },
  { key: 'se', label: 'Software Engineering', color: '#2e8b57' },
]

const data: ChartPoint[] = [
  { x: '2022', cs: 84, se: 80 },
  { x: '2023', cs: 85, se: 81 },
  { x: '2024', cs: 87, se: 82 },
  { x: '2025', cs: 88, se: 83 },
]

export function TrendsPage() {
  const [entityType, setEntityType] = useState('major')
  const [metric, setMetric] = useState('cutoff')
  const [dateRange, setDateRange] = useState('2022-2026')
  const [entitySearch, setEntitySearch] = useState('')

  return (
    <div className="space-y-5">
      <SectionHeader title="Trends" subtitle="Analyze changes over time across entity types and selected metrics." />

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

      <ChartCard title="Multi-Series Trend" actions={<InlineAnnotation label={metric.toUpperCase()} />}>
        <LineChartAdapter data={data} series={series} />
        <div className="mt-3">
          <ChartLegend series={series} />
        </div>
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-3">
        <TrendSummaryCard
          title="Biggest Increase"
          value="Computer Science"
          description="+4 points in cutoff since 2022."
          direction="up"
        />
        <TrendSummaryCard
          title="Biggest Decrease"
          value="Economics"
          description="-3 points after 2023 peak."
          direction="down"
        />
        <TrendSummaryCard
          title="Most Stable"
          value="Software Engineering"
          description="Low variance across selected range."
          direction="neutral"
        />
      </div>
    </div>
  )
}
