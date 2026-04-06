import { useEffect, useMemo, useState } from 'react'

import {
  Button,
  FilterPill,
  GlobalFilterBar,
  RankingList,
  SectionHeader,
  Skeleton,
} from '../components/design-system'
import { useDashboardRankings } from '../features/dashboard/api/use-dashboard-aggregates'
import { useAcademicAreaOptions } from '../features/global-filters/api/use-academic-area-options'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { useGlobalFilters } from '../features/global-filters/model/use-global-filters'
import { buildCompetitiveRankingItems, buildPopularRankingItems } from '../features/rankings/model/rankings-adapter'
import {
  buildProcessOptionsForYear,
  buildYearOptions,
  deriveDefaultYear,
  getLatestProcessOption,
  resolveSelectedProcessId,
} from '../features/rankings/model/rankings-filters'
import { deriveRankingsPageState } from '../features/rankings/model/rankings-page-state'
import { useI18n } from '../lib/i18n'

function toOptionalInt(value: string | null): number | null {
  if (!value) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function RankingsPage() {
  const { t } = useI18n()
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()
  const { options: processOptions, isLoading: processLoading, errorMessage: processError } = useProcessOptions()
  const { options: areaOptions, isLoading: areaLoading, errorMessage: areaError } = useAcademicAreaOptions()

  const [year, setYear] = useState('')
  const [isLoadingSettling, setIsLoadingSettling] = useState(false)

  const yearOptions = useMemo(() => buildYearOptions(processOptions), [processOptions])
  const latestProcessOption = useMemo(() => getLatestProcessOption(processOptions), [processOptions])

  useEffect(() => {
    if (year) {
      return
    }

    const derivedYear = deriveDefaultYear(processOptions, filters.processId)
    if (derivedYear) {
      setYear(derivedYear)
    }
  }, [filters.processId, processOptions, year])

  const filteredProcessOptions = useMemo(() => {
    if (!year) {
      return []
    }
    return buildProcessOptionsForYear(processOptions, year)
  }, [processOptions, year])

  const processIdFromFilters = toOptionalInt(filters.processId)
  const selectedProcessId = resolveSelectedProcessId(processIdFromFilters, filteredProcessOptions, latestProcessOption)
  const selectedAreaId = toOptionalInt(filters.academicAreaId)

  const rankingsQuery = useDashboardRankings({ processId: selectedProcessId, academicAreaId: selectedAreaId })

  const competitiveItems = useMemo(
    () => buildCompetitiveRankingItems(rankingsQuery.data?.most_competitive ?? []),
    [rankingsQuery.data?.most_competitive]
  )
  const popularItems = useMemo(() => buildPopularRankingItems(rankingsQuery.data?.most_popular ?? []), [rankingsQuery.data?.most_popular])

  const pageError = processError ?? areaError ?? rankingsQuery.errorMessage
  const isLoading = processLoading || areaLoading || rankingsQuery.isLoading

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    if (isLoading) {
      setIsLoadingSettling(true)
    } else if (isLoadingSettling) {
      timeoutId = setTimeout(() => setIsLoadingSettling(false), 220)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoading, isLoadingSettling])

  const showLoadingFeedback = isLoading || isLoadingSettling

  const pageState = deriveRankingsPageState({
    isLoading: showLoadingFeedback,
    errorMessage: pageError,
    competitiveCount: competitiveItems.length,
    popularCount: popularItems.length,
  })

  const selectedProcessLabel =
    processOptions.find((option) => option.value === String(selectedProcessId ?? ''))?.label ?? t('rankings.latestProcess')
  const selectedAreaLabel = areaOptions.find((option) => option.value === (filters.academicAreaId ?? ''))?.label

  return (
    <div className="space-y-5">
      <SectionHeader title={t('rankings.title')} subtitle={t('rankings.subtitle')} />

      <GlobalFilterBar
        processId={selectedProcessId ? String(selectedProcessId) : ''}
        year={year}
        academicAreaId={filters.academicAreaId ?? ''}
        processOptions={filteredProcessOptions}
        yearOptions={yearOptions}
        areaOptions={areaOptions}
        processDisabled={!year}
        onProcessChange={(value) => setProcessId(value || null)}
        onYearChange={(value) => {
          setYear(value)
          setProcessId(null)
        }}
        onAreaChange={(value) => setAcademicAreaId(value || null)}
        resetAction={
          <Button
            disabled={!hasActiveFilters}
            variant="secondary"
            onClick={() => {
              resetFilters()
              setYear('')
            }}
          >
            {t('rankings.reset')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {selectedProcessId ? <FilterPill label={t('common.process')} value={selectedProcessLabel} /> : null}
        {filters.academicAreaId ? <FilterPill label={t('common.area')} value={selectedAreaLabel ?? filters.academicAreaId} /> : null}
        {year ? <FilterPill label={t('common.year')} value={year} /> : null}
      </div>

      {pageError ? <p className="text-sm text-danger">{pageError}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primaryDark">{t('rankings.section.mostCompetitive')}</h3>
          {pageState === 'loading' ? (
            <div className="space-y-2 rounded-card border border-primary/10 bg-surface p-3 shadow-soft">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}
          {pageState === 'empty' ? <p className="text-sm text-textSecondary">{t('rankings.empty')}</p> : null}
          {pageState === 'ready' ? <RankingList items={competitiveItems} /> : null}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primaryDark">{t('rankings.section.largestIntake')}</h3>
          {pageState === 'loading' ? (
            <div className="space-y-2 rounded-card border border-primary/10 bg-surface p-3 shadow-soft">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}
          {pageState === 'empty' ? <p className="text-sm text-textSecondary">{t('rankings.empty')}</p> : null}
          {pageState === 'ready' ? <RankingList items={popularItems} /> : null}
        </section>
      </div>
    </div>
  )
}
