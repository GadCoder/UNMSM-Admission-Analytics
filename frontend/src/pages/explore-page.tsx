import { useEffect, useMemo, useState } from 'react'

import {
  Breadcrumbs,
  ChartCard,
  ExploreHeader,
  HighlightBanner,
  LineChartAdapter,
  MetricSelector,
  RankingList,
  SectionHeader,
  Select,
  StatCard,
  TrendSummaryCard,
  type SelectOption,
} from '../components/design-system'
import {
  useDashboardApplicantsTrend,
  useDashboardCutoffTrend,
  useDashboardOverview,
  useDashboardRankings,
} from '../features/dashboard/api/use-dashboard-aggregates'
import { useExploreMajorAnalytics, useExploreMajorTrends, useExploreMajors } from '../features/explore/api/use-explore-data'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { GlobalFilterBar as SharedGlobalFilterBar, useGlobalFilters } from '../features/global-filters'
import { useI18n } from '../lib/i18n'

function toOptionalInt(value: string | null): number | null {
  if (!value) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-'
  }
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-'
  }
  return `${(value * 100).toFixed(1)}%`
}

function trendDirection(current: number | null, previous: number | null): 'up' | 'down' | 'neutral' {
  if (current === null || previous === null) {
    return 'neutral'
  }
  if (Math.abs(current - previous) < 0.0001) {
    return 'neutral'
  }
  return current > previous ? 'up' : 'down'
}

function formatMetricValue(metricKey: string, value: number | null): string {
  if (value === null) {
    return '-'
  }
  if (metricKey === 'acceptance') {
    return formatPercent(value)
  }
  if (metricKey === 'cutoff') {
    return value.toFixed(1)
  }
  return formatInteger(value)
}

type ExploreTrendPoint = {
  x: string
  applicants: number | null
  admitted: number | null
  acceptance: number | null
  cutoff: number | null
}

export function ExplorePage() {
  const { t } = useI18n()
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()
  const processId = toOptionalInt(filters.processId)
  const academicAreaId = toOptionalInt(filters.academicAreaId)
  const [majorId, setMajorId] = useState('')
  const processOptions = useProcessOptions()
  const majorsQuery = useExploreMajors(academicAreaId)

  const majorOptions: SelectOption[] = useMemo(
    () =>
      (majorsQuery.data ?? [])
        .map((item) => ({ value: String(item.id), label: item.name }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [majorsQuery.data]
  )

  useEffect(() => {
    if (!majorId) {
      return
    }
    const exists = majorOptions.some((option) => option.value === majorId)
    if (!exists) {
      setMajorId('')
    }
  }, [majorId, majorOptions])

  const fallbackProcessId = toOptionalInt(processOptions.options[0]?.value ?? null)
  const effectiveProcessId = processId ?? fallbackProcessId
  const selectedMajorId = toOptionalInt(majorId)

  const overviewQuery = useDashboardOverview({
    processId: effectiveProcessId,
    academicAreaId,
  })
  const rankingsQuery = useDashboardRankings({ processId: effectiveProcessId, academicAreaId }, 5)
  const majorAnalyticsQuery = useExploreMajorAnalytics(selectedMajorId, effectiveProcessId)
  const majorTrendsQuery = useExploreMajorTrends(selectedMajorId, ['applicants', 'admitted', 'acceptance_rate', 'cutoff_score'])
  const [selectedMetric, setSelectedMetric] = useState('applicants')

  const applicantsTrendQuery = useDashboardApplicantsTrend(academicAreaId)
  const cutoffTrendQuery = useDashboardCutoffTrend(academicAreaId)

  const totalApplicants = selectedMajorId ? majorAnalyticsQuery.data?.metrics.applicants : overviewQuery.data?.metrics.total_applicants
  const totalAdmitted = selectedMajorId ? majorAnalyticsQuery.data?.metrics.admitted : overviewQuery.data?.metrics.total_admitted
  const acceptanceRate = selectedMajorId
    ? majorAnalyticsQuery.data?.metrics.acceptance_rate
    : overviewQuery.data?.metrics.acceptance_rate
  const majorCount = selectedMajorId ? 1 : overviewQuery.data?.metrics.total_majors

  const popularMajors = useMemo(() => {
    const items = rankingsQuery.data?.most_popular ?? []
    return [...items].sort((left, right) => {
      if (left.applicants !== right.applicants) {
        return right.applicants - left.applicants
      }
      return right.admitted - left.admitted
    })
  }, [rankingsQuery.data?.most_popular])

  const topApplicantCount = popularMajors[0]?.applicants ?? 0

  const metricOptions: SelectOption[] = selectedMajorId
      ? [
        { value: 'applicants', label: t('explore.kpi.applicants') },
        { value: 'admitted', label: t('explore.kpi.admitted') },
        { value: 'acceptance', label: t('explore.kpi.acceptance') },
        { value: 'cutoff', label: t('trends.metric.cutoff') },
      ]
    : [
        { value: 'applicants', label: t('explore.kpi.applicants') },
        { value: 'cutoff', label: t('trends.metric.cutoff') },
      ]

  useEffect(() => {
    const valid = metricOptions.some((option) => option.value === selectedMetric)
    if (!valid) {
      setSelectedMetric('applicants')
    }
  }, [metricOptions, selectedMetric])

  const trendData: ExploreTrendPoint[] = useMemo(() => {
    if (selectedMajorId) {
      return (majorTrendsQuery.data?.history ?? []).map((item) => ({
        x: item.process.label,
        applicants: Number(item.metrics.applicants ?? 0),
        admitted: Number(item.metrics.admitted ?? 0),
        acceptance: item.metrics.acceptance_rate === null ? null : Number(item.metrics.acceptance_rate),
        cutoff: item.metrics.cutoff_score === null ? null : Number(item.metrics.cutoff_score),
      }))
    }

    const byProcess = new Map<string, ExploreTrendPoint>()

    ;(applicantsTrendQuery.data?.items ?? []).forEach((item) => {
      byProcess.set(item.process.label, {
        x: item.process.label,
        applicants: item.applicants,
        admitted: null,
        acceptance: null,
        cutoff: null,
      })
    })

    ;(cutoffTrendQuery.data?.items ?? []).forEach((item) => {
      const current = byProcess.get(item.process.label)
      const cutoff = item.avg_cutoff_score === null ? null : Number(item.avg_cutoff_score)
      if (current) {
        byProcess.set(item.process.label, { ...current, cutoff })
      } else {
        byProcess.set(item.process.label, {
          x: item.process.label,
          applicants: null,
          admitted: null,
          acceptance: null,
          cutoff,
        })
      }
    })

    return [...byProcess.values()]
  }, [selectedMajorId, majorTrendsQuery.data?.history, applicantsTrendQuery.data?.items, cutoffTrendQuery.data?.items])

  const chartData = useMemo(
    () =>
      trendData
        .map((item) => ({
          x: item.x,
          value: item[selectedMetric as keyof ExploreTrendPoint],
        }))
        .filter((item) => item.value !== null)
        .map((item) => ({ x: item.x, value: Number(item.value) })),
    [trendData, selectedMetric]
  )

  const selectedMetricLabel = metricOptions.find((option) => option.value === selectedMetric)?.label ?? selectedMetric

  const latestTrend = trendData.length > 0 ? trendData[trendData.length - 1] : null
  const previousTrend = trendData.length > 1 ? trendData[trendData.length - 2] : null
  const latestApplicants = latestTrend?.applicants ?? null
  const previousApplicants = previousTrend?.applicants ?? null
  const latestCutoff = latestTrend?.cutoff ?? null
  const previousCutoff = previousTrend?.cutoff ?? null

  const loading = selectedMajorId
    ? majorAnalyticsQuery.isLoading || majorTrendsQuery.isLoading
    : overviewQuery.isLoading || rankingsQuery.isLoading
  const dashboardError =
    (selectedMajorId
      ? majorAnalyticsQuery.errorMessage ?? majorTrendsQuery.errorMessage
      : overviewQuery.errorMessage ?? rankingsQuery.errorMessage) ??
    applicantsTrendQuery.errorMessage ??
    cutoffTrendQuery.errorMessage ??
    majorsQuery.errorMessage

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: t('explore.breadcrumb.home'), href: '/dashboard' }, { label: t('explore.breadcrumb.results'), href: '/explore' }]} />

      <ExploreHeader
        title={t('explore.title')}
        description={t('explore.description')}
      />

      <SharedGlobalFilterBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        setProcessId={setProcessId}
        setAcademicAreaId={(value) => {
          setAcademicAreaId(value)
          setMajorId('')
        }}
        resetFilters={resetFilters}
      />

      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft md:p-5">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Select
            label={t('explore.major')}
            value={majorId}
            options={majorOptions}
            placeholder={majorsQuery.isLoading ? t('explore.loadingMajors') : t('explore.allMajors')}
            disabled={majorsQuery.isLoading || majorOptions.length === 0}
            onChange={(event) => setMajorId(event.target.value)}
          />
          <HighlightBanner
            icon={selectedMajorId ? '◉' : '◎'}
            label={t('explore.scope.label')}
            value={selectedMajorId ? t('explore.scope.majorActive') : t('explore.scope.areaOverview')}
          />
        </div>
      </section>

      {processId === null ? <p className="text-sm text-textSecondary">{t('explore.noProcessSelected')}</p> : null}
      {dashboardError ? <p className="text-sm text-danger">{dashboardError}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('explore.kpi.applicants')} value={loading ? t('common.loading') : formatInteger(totalApplicants)} />
        <StatCard label={t('explore.kpi.admitted')} value={loading ? t('common.loading') : formatInteger(totalAdmitted)} />
        <StatCard label={t('explore.kpi.acceptance')} value={loading ? t('common.loading') : formatPercent(acceptanceRate)} />
        <StatCard label={t('explore.kpi.majorsInScope')} value={loading ? t('common.loading') : formatInteger(majorCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <ChartCard title={selectedMajorId ? t('explore.chart.selectedMajorTrend') : t('explore.chart.resultTrendExplorer')} actions={<MetricSelector value={selectedMetric} onChange={setSelectedMetric} options={metricOptions} />}>
          {trendData.length === 0 ? (
            <p className="text-sm text-textSecondary">{t('explore.chart.noData')}</p>
          ) : (
            <LineChartAdapter data={chartData} series={[{ key: 'value', label: selectedMetricLabel, color: '#8f5658' }]} />
          )}
        </ChartCard>

        <div className="grid gap-4">
          <TrendSummaryCard
            title={t('explore.summary.latestApplicants')}
            value={formatMetricValue('applicants', latestApplicants)}
            description={t('explore.summary.comparedToPrevious')}
            direction={trendDirection(latestApplicants, previousApplicants)}
          />
          <TrendSummaryCard
            title={t('explore.summary.latestCutoff')}
            value={formatMetricValue('cutoff', latestCutoff)}
            description={t('explore.summary.comparedToPrevious')}
            direction={trendDirection(latestCutoff, previousCutoff)}
          />
          <TrendSummaryCard
            title={t('explore.summary.currentAcceptance')}
            value={formatPercent(acceptanceRate)}
            description={selectedMajorId ? t('explore.summary.selectedMajorAcceptance') : t('explore.summary.scopeAcceptance')}
            direction="neutral"
          />
        </div>
      </div>

      <section className="rounded-card border border-primary/10 bg-surface p-5 shadow-soft">
        <SectionHeader
          title={selectedMajorId ? t('explore.snapshot.selectedMajor') : t('explore.snapshot.mostDemanded')}
          subtitle={
            selectedMajorId
              ? t('explore.snapshot.selectedMajorSubtitle')
              : t('explore.snapshot.mostDemandedSubtitle')
          }
        />
        {loading ? <p className="text-sm text-textSecondary">{t('explore.snapshot.loading')}</p> : null}
        {!loading && !selectedMajorId && popularMajors.length === 0 ? <p className="text-sm text-textSecondary">{t('explore.snapshot.empty')}</p> : null}
        {!loading && selectedMajorId && majorAnalyticsQuery.data ? (
          <RankingList
            items={[
              {
                id: String(majorAnalyticsQuery.data.major.id),
                label: majorAnalyticsQuery.data.major.name,
                value: t('explore.value.applicants').replace('{count}', formatInteger(majorAnalyticsQuery.data.metrics.applicants)),
                description: t('explore.value.admitted').replace('{count}', formatInteger(majorAnalyticsQuery.data.metrics.admitted)),
                progress: 100,
              },
            ]}
          />
        ) : null}
        {!loading && !selectedMajorId && popularMajors.length > 0 ? (
          <RankingList
            items={popularMajors.map((item) => ({
              id: String(item.major.id),
              label: item.major.name,
              value: t('explore.value.applicants').replace('{count}', formatInteger(item.applicants)),
              description: t('explore.value.admitted').replace('{count}', formatInteger(item.admitted)),
              progress:
                topApplicantCount <= 0
                  ? undefined
                  : Math.max(0, Math.min(100, Math.round((item.applicants / topApplicantCount) * 100))),
            }))}
          />
        ) : null}
      </section>
    </div>
  )
}
