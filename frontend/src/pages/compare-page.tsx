import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ChartCard,
  DataTable,
  HighlightBanner,
  InlineProgressBar,
  LineChartAdapter,
  MetricSelector,
  MultiSelectSearch,
  SectionHeader,
  Skeleton,
  StatCard,
  type DataColumn,
  type SelectOption,
} from '../components/design-system'
import { useCompareEntitiesData, useCompareMajorOptions } from '../features/compare/api/use-compare-data'
import { deriveComparePageState } from '../features/compare/model/compare-page-state'
import { MAX_COMPARE_SELECTION, applySelectionLimit } from '../features/compare/model/compare-table'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { GlobalFilterBar, useGlobalFilters } from '../features/global-filters'
import { useI18n } from '../lib/i18n'

type TrendMetricKey = 'applicants' | 'admitted' | 'acceptance_rate'
type AxisDomainValue = number | 'auto' | 'dataMin' | 'dataMax'
type RankedMajorRow = {
  id: string
  rank: number
  major: string
  applicants: number | null
  admitted: number | null
  acceptanceRate: number | null
  applicantsProgress: number
  admittedProgress: number
  acceptanceProgress: number
  applicantsTrendPct: number | null
}

type SnapshotCard = {
  label: string
  value: string
  helperText?: string
  labelTooltip?: string
}

const COMPARE_COLORS = ['#8f5658', '#2e8b57', '#3f5ba9', '#b46a2f', '#5f4b8b']

function toOptionalInt(value: string | null): number | null {
  if (!value) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function getApplicantsTrendPct(history: Array<{ metrics: { applicants: number | null } }> | undefined): number | null {
  if (!history || history.length < 2) {
    return null
  }

  const latest = history[history.length - 1]?.metrics.applicants
  const previous = history[history.length - 2]?.metrics.applicants

  if (latest === null || latest === undefined || previous === null || previous === undefined || previous <= 0) {
    return null
  }

  return ((latest - previous) / previous) * 100
}

export function ComparePage() {
  const { t } = useI18n()
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()
  const academicAreaId = toOptionalInt(filters.academicAreaId)
  const processId = toOptionalInt(filters.processId)

  const [selected, setSelected] = useState<SelectOption[]>([])
  const [selectionFeedback, setSelectionFeedback] = useState<string | null>(null)
  const [trendMetric, setTrendMetric] = useState<TrendMetricKey>('applicants')
  const [isLoadingSettling, setIsLoadingSettling] = useState(false)

  const metricOptions: SelectOption[] = [
    { value: 'applicants', label: t('compare.table.applicants') },
    { value: 'admitted', label: t('compare.table.admitted') },
    { value: 'acceptance_rate', label: t('compare.snapshot.acceptanceRate') },
  ]

  const majorOptionsQuery = useCompareMajorOptions(academicAreaId)
  const processOptions = useProcessOptions()

  const loadOptions = useCallback(
    async (query: string) => {
      const normalized = query.trim().toLowerCase()
      if (!normalized) {
        return majorOptionsQuery.options
      }

      return majorOptionsQuery.options.filter((entry) => entry.label.toLowerCase().includes(normalized))
    },
    [majorOptionsQuery.options]
  )

  const compareData = useCompareEntitiesData(selected, processId)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    if (compareData.isLoading) {
      setIsLoadingSettling(true)
    } else if (isLoadingSettling) {
      timeoutId = setTimeout(() => setIsLoadingSettling(false), 220)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [compareData.isLoading, isLoadingSettling])

  const showLoadingFeedback = selected.length > 0 && (compareData.isLoading || isLoadingSettling)

  const snapshotProcessLabel = useMemo(() => {
    if (processId === null) {
      return t('rankings.latestProcess')
    }
    if (processOptions.isLoading) {
      return t('filters.loadingProcess')
    }
    const matched = processOptions.options.find((option) => Number(option.value) === processId)
    return matched?.label ?? t('filters.processFallback').replace('{id}', String(processId))
  }, [processId, processOptions.isLoading, processOptions.options, t])

  const loadingCount = compareData.entities.filter((entity) => entity.isLoading).length
  const successCount = compareData.entities.filter((entity) => Boolean(entity.analytics)).length
  const errorCount = compareData.entities.filter((entity) => Boolean(entity.errorMessage)).length

  const compareState = deriveComparePageState({
    selectedCount: selected.length,
    loadingCount,
    successCount,
    errorCount,
  })

  const partialErrorLabels = compareData.entities
    .filter((entity) => entity.errorMessage)
    .map((entity) => entity.label)
    .join(', ')

  const entitiesWithAnalytics = useMemo(
    () => compareData.entities.filter((entity) => entity.analytics),
    [compareData.entities]
  )

  const snapshotCards = useMemo<SnapshotCard[]>(() => {
    if (selected.length === 1) {
      const major = entitiesWithAnalytics[0]
      return [
        {
          label: t('compare.snapshot.comparedMajors'),
          value: String(selected.length),
          helperText: t('compare.snapshot.selectedNow'),
        },
        {
          label: t('compare.snapshot.applicants'),
          value: major ? new Intl.NumberFormat('en-US').format(major.analytics?.metrics.applicants ?? 0) : '-',
          helperText: major ? major.label : t('compare.snapshot.selectedMajor'),
        },
        {
          label: t('compare.snapshot.admitted'),
          value: major ? new Intl.NumberFormat('en-US').format(major.analytics?.metrics.admitted ?? 0) : '-',
          helperText: major ? major.label : t('compare.snapshot.selectedMajor'),
        },
        {
          label: t('compare.snapshot.acceptanceRate'),
          value: major && major.analytics?.metrics.acceptance_rate !== null
            ? `${((major.analytics?.metrics.acceptance_rate ?? 0) * 100).toFixed(1)}%`
            : '-',
          helperText: major ? major.label : t('compare.snapshot.selectedMajor'),
          labelTooltip: t('compare.acceptanceTooltip'),
        },
      ]
    }

    const majorsWithAcceptance = entitiesWithAnalytics.filter((entity) => entity.analytics?.metrics.acceptance_rate !== null)
    const mostCompetitive = [...majorsWithAcceptance].sort(
      (left, right) => (left.analytics?.metrics.acceptance_rate ?? 1) - (right.analytics?.metrics.acceptance_rate ?? 1)
    )[0]
    const highestAcceptance = [...majorsWithAcceptance].sort(
      (left, right) => (right.analytics?.metrics.acceptance_rate ?? 0) - (left.analytics?.metrics.acceptance_rate ?? 0)
    )[0]
    const highestDemand = [...entitiesWithAnalytics].sort(
      (left, right) => (right.analytics?.metrics.applicants ?? 0) - (left.analytics?.metrics.applicants ?? 0)
    )[0]

    return [
      {
        label: t('compare.snapshot.comparedMajors'),
        value: String(selected.length),
        helperText: t('compare.snapshot.selectedNow'),
      },
      {
        label: t('compare.snapshot.mostCompetitive'),
        value: mostCompetitive?.label ?? '-',
        helperText:
          mostCompetitive && mostCompetitive.analytics?.metrics.acceptance_rate !== null
            ? t('compare.snapshot.acceptanceSuffix').replace('{value}', ((mostCompetitive.analytics?.metrics.acceptance_rate ?? 0) * 100).toFixed(1))
            : t('compare.snapshot.noAcceptanceData'),
      },
      {
        label: t('compare.snapshot.highestAcceptance'),
        value: highestAcceptance?.label ?? '-',
        helperText:
          highestAcceptance && highestAcceptance.analytics?.metrics.acceptance_rate !== null
            ? t('compare.snapshot.acceptanceSuffix').replace('{value}', ((highestAcceptance.analytics?.metrics.acceptance_rate ?? 0) * 100).toFixed(1))
            : t('compare.snapshot.noAcceptanceData'),
      },
      {
        label: t('compare.snapshot.highestDemand'),
        value: highestDemand?.label ?? '-',
        helperText:
          highestDemand
            ? t('compare.snapshot.applicantsSuffix').replace(
              '{value}',
              new Intl.NumberFormat('en-US').format(highestDemand.analytics?.metrics.applicants ?? 0),
            )
            : t('compare.snapshot.noDemandData'),
      },
    ]
  }, [entitiesWithAnalytics, selected.length, snapshotProcessLabel, t])

  const trendSeries = useMemo(
    () => selected.map((entity, index) => ({ key: `major_${entity.value}`, label: entity.label, color: COMPARE_COLORS[index % COMPARE_COLORS.length] })),
    [selected]
  )

  const trendYAxisDomain: [AxisDomainValue, AxisDomainValue] =
    trendMetric === 'acceptance_rate' ? ['auto', 'auto'] : [0, 'auto']

  const trendExplorerData = useMemo(() => {
    const processLabels: string[] = []

    compareData.entities.forEach((entity) => {
      entity.trends?.history.forEach((item) => {
        if (!processLabels.includes(item.process.label)) {
          processLabels.push(item.process.label)
        }
      })
    })

    return processLabels.map((label) => {
      const row: { x: string; [key: string]: string | number } = { x: label }

      compareData.entities.forEach((entity) => {
        const point = entity.trends?.history.find((item) => item.process.label === label)
        if (!point) {
          return
        }

        const value = point.metrics[trendMetric]
        if (value === null) {
          return
        }

        row[`major_${entity.key}`] = trendMetric === 'acceptance_rate' ? Number((value * 100).toFixed(2)) : value
      })

      return row
    })
  }, [compareData.entities, trendMetric])

  const rankedRows = useMemo<RankedMajorRow[]>(() => {
    const rows = [...compareData.entities]
      .sort((left, right) => (right.analytics?.metrics.applicants ?? -1) - (left.analytics?.metrics.applicants ?? -1))
      .map((entity, index) => ({
        id: entity.key,
        rank: index + 1,
        major: entity.label,
        applicants: entity.analytics?.metrics.applicants ?? null,
        admitted: entity.analytics?.metrics.admitted ?? null,
        acceptanceRate: entity.analytics?.metrics.acceptance_rate ?? null,
        applicantsProgress: 0,
        admittedProgress: 0,
        acceptanceProgress: 0,
        applicantsTrendPct: getApplicantsTrendPct(entity.trends?.history),
      }))

    const maxApplicants = Math.max(...rows.map((row) => row.applicants ?? 0), 0)
    const maxAdmitted = Math.max(...rows.map((row) => row.admitted ?? 0), 0)
    return rows.map((row) => ({
      ...row,
      applicantsProgress: row.applicants === null || maxApplicants === 0 ? 0 : (row.applicants / maxApplicants) * 100,
      admittedProgress: row.admitted === null || maxAdmitted === 0 ? 0 : (row.admitted / maxAdmitted) * 100,
      acceptanceProgress: row.acceptanceRate === null ? 0 : row.acceptanceRate * 100,
    }))
  }, [compareData.entities])

  const rankingColumns: DataColumn<RankedMajorRow>[] = [
    {
      key: 'rank',
      header: '#',
      render: (row) => <span className="font-semibold text-primaryDark">{row.rank}</span>,
    },
    {
      key: 'major',
      header: t('compare.table.major'),
      render: (row) => <span className="font-medium">{row.major}</span>,
    },
    {
      key: 'applicants',
      header: t('compare.table.applicants'),
      align: 'right',
      render: (row) => (
        <div className="ml-auto min-w-44 space-y-1">
          <InlineProgressBar value={row.applicantsProgress} />
          <span className="block text-right text-xs font-semibold text-textPrimary">
            {row.applicants === null ? '-' : new Intl.NumberFormat('en-US').format(row.applicants)}
          </span>
        </div>
      ),
    },
    {
      key: 'admitted',
      header: t('compare.table.admitted'),
      align: 'right',
      render: (row) => (
        <div className="ml-auto w-24">
          <div className="h-2 rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary/45" style={{ width: `${row.admittedProgress}%` }} />
          </div>
          <span className="mt-1 block text-right text-xs font-semibold text-textPrimary">
            {row.admitted === null ? '-' : new Intl.NumberFormat('en-US').format(row.admitted)}
          </span>
        </div>
      ),
    },
    {
      key: 'acceptanceRate',
      header: t('compare.table.acceptance'),
      align: 'right',
      render: (row) => (
        <div className="ml-auto w-24">
          <div className="h-2 rounded-full bg-success/10">
            <div className="h-full rounded-full bg-success/45" style={{ width: `${row.acceptanceProgress}%` }} />
          </div>
          <span className="mt-1 block text-right text-xs font-semibold text-textPrimary">
            {row.acceptanceRate === null ? '-' : `${(row.acceptanceRate * 100).toFixed(1)}%`}
          </span>
        </div>
      ),
    },
    {
      key: 'trend',
      header: t('compare.table.trend'),
      align: 'right',
      render: (row) => {
        if (row.applicantsTrendPct === null) {
          return <span className="text-xs text-textSecondary">-</span>
        }

        const isUp = row.applicantsTrendPct >= 0
        const arrow = isUp ? '▲' : '▼'
        const value = `${Math.abs(row.applicantsTrendPct).toFixed(1)}%`
        return (
          <span className={isUp ? 'font-semibold text-success' : 'font-semibold text-danger'}>
            {arrow} {isUp ? '+' : '-'}{value}
          </span>
        )
      },
    },
  ]

  const handleSelectionChange = (nextSelected: SelectOption[]) => {
    const limited = applySelectionLimit(nextSelected, MAX_COMPARE_SELECTION)
    setSelected(limited.nextSelection)
    setSelectionFeedback(
      limited.limitReached
        ? t('compare.selection.limit').replace('{max}', String(MAX_COMPARE_SELECTION))
        : null
    )
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeader title={t('compare.title')} subtitle={t('compare.subtitle')} />

      <section className="space-y-3 rounded-card border border-primary/10 bg-background/40 p-3 shadow-soft md:space-y-4">
        <GlobalFilterBar
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          setProcessId={setProcessId}
          setAcademicAreaId={setAcademicAreaId}
          resetFilters={resetFilters}
          compact
        />

        <MultiSelectSearch
          selected={selected}
          onChange={handleSelectionChange}
          loadOptions={loadOptions}
          maxSelection={MAX_COMPARE_SELECTION}
          statusMessage={selectionFeedback}
          compact
        />

        {majorOptionsQuery.isLoading ? <p className="text-xs text-textSecondary">{t('compare.loadingMajorOptions')}</p> : null}
        {majorOptionsQuery.errorMessage ? <p className="text-xs text-danger">{majorOptionsQuery.errorMessage}</p> : null}
      </section>
      {selected.length === 0 ? (
        <HighlightBanner
          icon="◎"
          label={t('compare.startHere')}
          value={t('compare.selectMajors')}
        />
      ) : null}

      {compareState !== 'empty' ? (
        <section className="space-y-4 rounded-card border border-primary/10 bg-surface p-4 shadow-soft md:space-y-5 md:p-5">
          <SectionHeader
            title={t('compare.currentProcess.title')}
            subtitle={t('compare.currentProcess.subtitle')}
          />
          <p className="text-sm text-textSecondary">
            {t('compare.showingDataFor')} <span className="font-semibold text-primaryDark">{snapshotProcessLabel}</span>
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {snapshotCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                helperText={card.helperText}
                labelTooltip={card.labelTooltip}
              />
            ))}
          </div>

          <SectionHeader
            title={t('compare.ranking.title')}
            subtitle={t('compare.ranking.subtitle')}
            actions={<span className="text-xs text-textSecondary" title={t('compare.ranking.infoTooltip')}>{t('compare.ranking.info')}</span>}
          />

          {showLoadingFeedback ? (
            <div className="space-y-2 rounded-card border border-primary/10 bg-surface p-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}

          {compareState === 'loading' && !showLoadingFeedback ? <p className="text-sm text-textSecondary">{t('compare.ranking.loadingMetrics')}</p> : null}
          {compareState === 'error' ? <p className="text-sm text-danger">{t('compare.ranking.error')}</p> : null}
          {compareState === 'partial' ? (
            <p className="text-sm text-textSecondary">{t('compare.ranking.partial').replace('{labels}', partialErrorLabels)}</p>
          ) : null}

          {!showLoadingFeedback && rankedRows.length > 0 ? <DataTable columns={rankingColumns} rows={rankedRows} getRowKey={(row) => row.id} /> : null}
        </section>
      ) : null}

      {compareState !== 'empty' ? (
        <section className="space-y-3 rounded-card border border-primary/10 bg-background/45 p-4 shadow-soft md:p-5">
          <SectionHeader
            title={t('compare.trends.title')}
            subtitle={t('compare.trends.subtitle')}
            actions={<MetricSelector value={trendMetric} onChange={(value) => setTrendMetric(value as TrendMetricKey)} options={metricOptions} variant="segmented" />}
          />
          <ChartCard title={t('compare.trends.explorer')}>
            {showLoadingFeedback ? (
              <div className="space-y-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : trendExplorerData.length === 0 || trendSeries.length === 0 ? (
              <p className="text-sm text-textSecondary">{t('compare.trends.empty')}</p>
            ) : (
              <>
                <LineChartAdapter data={trendExplorerData} series={trendSeries} yAxisDomain={trendYAxisDomain} showLegend />
                <p className="mt-3 text-xs text-textSecondary">{t('compare.trends.note')}</p>
              </>
            )}
          </ChartCard>
        </section>
      ) : null}

      {compareState === 'empty' ? <p className="text-sm text-textSecondary">{t('compare.empty')}</p> : null}
    </div>
  )
}
