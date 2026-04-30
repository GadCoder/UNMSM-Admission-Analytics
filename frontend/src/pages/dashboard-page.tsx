import { useEffect, useMemo, useState } from 'react'

import {
  Button,
  FilterPill,
  GlobalFilterBar,
  Grid,
  GridItem,
  RankingList,
  SectionHeader,
  StatCard,
  TrendIndicator,
  type SelectOption,
} from '../components/design-system'
import {
  useDashboardApplicantsTrend,
  useDashboardCutoffTrend,
  useDashboardOverview,
  useDashboardRankings,
} from '../features/dashboard/api/use-dashboard-aggregates'
import { useAcademicAreaOptions } from '../features/global-filters/api/use-academic-area-options'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { useGlobalFilters } from '../features/global-filters/model/use-global-filters'
import { useI18n } from '../lib/i18n'

function toOptionalInt(value: string | null): number | null {
  if (!value) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function formatInteger(value: number | undefined): string {
  if (value === undefined) {
    return '-'
  }
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value: number | null | undefined): string {
  if (value === undefined || value === null) {
    return '-'
  }
  return `${(value * 100).toFixed(1)}%`
}

function formatShare(value: number, total: number | undefined): string {
  if (!total || total <= 0) {
    return '-'
  }
  return formatPercent(value / total)
}

function deriveTrend(current: number, previous: number): { direction: 'up' | 'down' | 'neutral'; value: string } {
  if (previous <= 0) {
    return { direction: 'neutral', value: 'N/D' }
  }
  const delta = ((current - previous) / previous) * 100
  if (Math.abs(delta) < 0.05) {
    return { direction: 'neutral', value: '0.0%' }
  }
  if (delta > 0) {
    return { direction: 'up', value: `+${delta.toFixed(1)}%` }
  }
  return { direction: 'down', value: `${delta.toFixed(1)}%` }
}

function parseProcessLabel(label: string): { year: string; cycle: 'I' | 'II' } | null {
  const match = /^(\d{4})-(I|II)$/i.exec(label.trim())
  if (!match) {
    return null
  }
  return { year: match[1], cycle: match[2].toUpperCase() as 'I' | 'II' }
}

function compareProcessRecency(left: SelectOption, right: SelectOption): number {
  const leftParsed = parseProcessLabel(left.label)
  const rightParsed = parseProcessLabel(right.label)

  if (!leftParsed || !rightParsed) {
    return right.label.localeCompare(left.label)
  }

  const yearDelta = Number(rightParsed.year) - Number(leftParsed.year)
  if (yearDelta !== 0) {
    return yearDelta
  }

  const cycleOrder: Record<'I' | 'II', number> = { I: 0, II: 1 }
  return cycleOrder[rightParsed.cycle] - cycleOrder[leftParsed.cycle]
}

export function DashboardPage() {
  const { t } = useI18n()
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()
  const { options: processOptions, errorMessage: processError } = useProcessOptions()
  const { options: areaOptions, errorMessage: areaError } = useAcademicAreaOptions()

  const [year, setYear] = useState('')

  const yearOptions: SelectOption[] = useMemo(() => {
    const availableYears = new Set<string>()
    processOptions.forEach((option) => {
      const parsed = parseProcessLabel(option.label)
      if (parsed) {
        availableYears.add(parsed.year)
      }
    })

    return [...availableYears]
      .sort((a, b) => Number(b) - Number(a))
      .map((value) => ({ value, label: value }))
  }, [processOptions])

  const latestProcessOption = useMemo(() => {
    const sorted = [...processOptions].sort(compareProcessRecency)
    return sorted[0] ?? null
  }, [processOptions])

  useEffect(() => {
    if (year) {
      return
    }

    if (filters.processId) {
      const processFromFilters = processOptions.find((option) => option.value === filters.processId)
      const parsed = processFromFilters ? parseProcessLabel(processFromFilters.label) : null
      if (parsed?.year) {
        setYear(parsed.year)
        return
      }
    }

    const latestParsed = latestProcessOption ? parseProcessLabel(latestProcessOption.label) : null
    if (latestParsed?.year) {
      setYear(latestParsed.year)
    }
  }, [filters.processId, latestProcessOption, processOptions, year])

  const filteredProcessOptions: SelectOption[] = useMemo(() => {
    if (!year) {
      return []
    }

    return processOptions
      .filter((option) => {
        const parsed = parseProcessLabel(option.label)
        return parsed?.year === year && (parsed.cycle === 'I' || parsed.cycle === 'II')
      })
      .sort(compareProcessRecency)
  }, [processOptions, year])

  const processIdFromFilters = toOptionalInt(filters.processId)
  const selectedProcessId =
    processIdFromFilters !== null && filteredProcessOptions.some((option) => option.value === String(processIdFromFilters))
      ? processIdFromFilters
      : toOptionalInt(filteredProcessOptions[0]?.value ?? latestProcessOption?.value ?? null)
  const selectedAreaId = toOptionalInt(filters.academicAreaId)

  const overviewQuery = useDashboardOverview({
    processId: selectedProcessId,
    academicAreaId: selectedAreaId,
  })
  const rankingsQuery = useDashboardRankings(
    {
      processId: selectedProcessId,
      academicAreaId: selectedAreaId,
    },
    5
  )
  const applicantsTrendQuery = useDashboardApplicantsTrend(selectedAreaId)
  const cutoffTrendQuery = useDashboardCutoffTrend(selectedAreaId)

  const loading =
    overviewQuery.isLoading || rankingsQuery.isLoading || applicantsTrendQuery.isLoading || cutoffTrendQuery.isLoading

  const dashboardError =
    processError ??
    areaError ??
    overviewQuery.errorMessage ??
    rankingsQuery.errorMessage ??
    applicantsTrendQuery.errorMessage ??
    cutoffTrendQuery.errorMessage

  const competitiveMajors = useMemo(() => {
    const items = rankingsQuery.data?.most_competitive ?? []
    return [...items].sort((left, right) => {
      if (left.acceptance_rate === null && right.acceptance_rate === null) {
        return right.applicants - left.applicants
      }
      if (left.acceptance_rate === null) {
        return 1
      }
      if (right.acceptance_rate === null) {
        return -1
      }
      if (left.acceptance_rate !== right.acceptance_rate) {
        return left.acceptance_rate - right.acceptance_rate
      }
      return right.applicants - left.applicants
    })
  }, [rankingsQuery.data?.most_competitive])

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
  const totalApplicants = overviewQuery.data?.metrics.total_applicants
  const trendItems = applicantsTrendQuery.data?.items ?? []
  const latestTrend = trendItems.length > 0 ? trendItems[trendItems.length - 1] : null
  const previousTrend = trendItems.length > 1 ? trendItems[trendItems.length - 2] : null
  const applicantsTrend =
    latestTrend && previousTrend
      ? deriveTrend(latestTrend.applicants, previousTrend.applicants)
      : { direction: 'neutral' as const, value: 'N/A' }

  const selectedProcessLabel =
    processOptions.find((option) => option.value === String(selectedProcessId ?? ''))?.label ?? t('dashboard.noProcessSelected')
  const selectedAreaSlug = areaOptions.find((option) => option.value === (filters.academicAreaId ?? ''))?.slug

  return (
    <div className="space-y-5">
      <SectionHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <GlobalFilterBar
        processId={selectedProcessId ? String(selectedProcessId) : ''}
        year={year}
        academicAreaId={filters.academicAreaId ?? ''}
        processOptions={filteredProcessOptions}
        yearOptions={yearOptions}
        areaOptions={areaOptions}
        onProcessChange={(value) => setProcessId(value || null)}
        processDisabled={!year}
        onYearChange={(value) => {
          setYear(value)
          setProcessId(null)
        }}
        onAreaChange={(value) => setAcademicAreaId(value || null)}
        resetAction={
          <Button disabled={!hasActiveFilters} variant="secondary" onClick={() => {
            resetFilters()
            setYear('')
          }}>
            {t('dashboard.resetFilters')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {selectedProcessId ? <FilterPill label={t('common.process')} value={selectedProcessLabel} /> : null}
        {filters.academicAreaId ? <FilterPill label={t('common.area')} value={selectedAreaSlug ?? filters.academicAreaId} /> : null}
        {year ? <FilterPill label={t('common.year')} value={year} /> : null}
      </div>

      {dashboardError ? <p className="text-sm text-danger">{dashboardError}</p> : null}

      <Grid>
        <GridItem span={3}>
            <StatCard
            label={t('dashboard.kpi.applicants')}
            value={loading ? t('common.loading') : formatInteger(overviewQuery.data?.metrics.total_applicants)}
            trend={<TrendIndicator direction={applicantsTrend.direction} value={applicantsTrend.value} />}
          />
        </GridItem>
        <GridItem span={3}>
          <StatCard
            label={t('dashboard.kpi.admitted')}
            value={loading ? t('common.loading') : formatInteger(overviewQuery.data?.metrics.total_admitted)}
            trend={<TrendIndicator direction="neutral" value={latestTrend ? latestTrend.process.label : t('common.na')} />}
          />
        </GridItem>
        <GridItem span={3}>
          <StatCard
            label={t('dashboard.kpi.acceptanceRate')}
            value={loading ? t('common.loading') : formatPercent(overviewQuery.data?.metrics.acceptance_rate)}
            trend={<TrendIndicator direction="neutral" value={t('dashboard.trend.fromSelectedProcess')} />}
          />
        </GridItem>
        <GridItem span={3}>
          <StatCard
            label={t('dashboard.kpi.majors')}
            value={loading ? t('common.loading') : formatInteger(overviewQuery.data?.metrics.total_majors)}
            helperText={t('dashboard.helper.activeMajors')}
            variant="with-helper"
          />
        </GridItem>
      </Grid>

      <Grid>
        <GridItem span={6}>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primaryDark">{t('dashboard.section.mostCompetitive')}</h3>
            {loading ? <p className="text-sm text-textSecondary">{t('common.loading')}</p> : null}
            {!loading && competitiveMajors.length === 0 ? <p className="text-sm text-textSecondary">{t('dashboard.empty.rankingData')}</p> : null}
            {!loading && competitiveMajors.length > 0 ? (
              <RankingList
                items={competitiveMajors.map((item) => ({
                  id: String(item.major.id),
                  label: item.major.name,
                  value: formatPercent(item.acceptance_rate),
                  description: t('dashboard.description.admittedFromApplicants')
                    .replace('{admitted}', formatInteger(item.admitted))
                    .replace('{applicants}', formatInteger(item.applicants)),
                  progress:
                    item.acceptance_rate === null
                      ? undefined
                      : Math.max(0, Math.min(100, Math.round(item.acceptance_rate * 100))),
                }))}
              />
            ) : null}
          </div>
        </GridItem>
        <GridItem span={6}>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primaryDark">{t('dashboard.section.largestIntake')}</h3>
            {loading ? <p className="text-sm text-textSecondary">{t('common.loading')}</p> : null}
            {!loading && popularMajors.length === 0 ? <p className="text-sm text-textSecondary">{t('dashboard.empty.rankingData')}</p> : null}
            {!loading && popularMajors.length > 0 ? (
              <RankingList
                items={popularMajors.map((item) => ({
                  id: String(item.major.id),
                  label: item.major.name,
                  value: t('dashboard.value.applicants').replace('{count}', formatInteger(item.applicants)),
                  description: t('dashboard.description.shareOfApplicants').replace(
                    '{share}',
                    formatShare(item.applicants, totalApplicants),
                  ),
                  progress:
                    topApplicantCount <= 0
                      ? undefined
                      : Math.max(0, Math.min(100, Math.round((item.applicants / topApplicantCount) * 100))),
                }))}
              />
            ) : null}
          </div>
        </GridItem>
      </Grid>

    </div>
  )
}
