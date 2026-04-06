import { useMemo, useState } from 'react'

import { useI18n } from '../../../lib/i18n'
import { useAcademicAreaOptions } from '../api/use-academic-area-options'
import { useProcessOptions } from '../api/use-process-options'
import type { GlobalFilters } from '../model/global-filter-params'
import { AcademicAreaSelector } from './academic-area-selector'
import { ProcessSelector } from './process-selector'
import { ResetGlobalFiltersButton } from './reset-global-filters-button'

type GlobalFilterBarProps = {
  filters: GlobalFilters
  hasActiveFilters: boolean
  setProcessId: (nextValue: string | null) => void
  setAcademicAreaId: (nextValue: string | null) => void
  resetFilters: () => void
  showAcademicArea?: boolean
  compact?: boolean
}

export function GlobalFilterBar({
  filters,
  hasActiveFilters,
  setProcessId,
  setAcademicAreaId,
  resetFilters,
  showAcademicArea = true,
  compact = false,
}: GlobalFilterBarProps) {
  const { t } = useI18n()
  const processOptions = useProcessOptions()
  const academicAreaOptions = useAcademicAreaOptions()
  const [isEditing, setIsEditing] = useState(false)

  const selectedProcessLabel = useMemo(() => {
    if (processOptions.isLoading) {
      return t('filters.loadingProcess')
    }
    if (!filters.processId) {
      return t('filters.allProcesses')
    }
    return processOptions.options.find((option) => option.value === filters.processId)?.label ?? t('filters.processFallback').replace('{id}', filters.processId)
  }, [filters.processId, processOptions.isLoading, processOptions.options, t])

  const selectedAcademicAreaLabel = useMemo(() => {
    if (!showAcademicArea) {
      return null
    }
    if (academicAreaOptions.isLoading) {
      return t('filters.loadingArea')
    }
    if (!filters.academicAreaId) {
      return t('filters.allAreas')
    }
    return (
      academicAreaOptions.options.find((option) => option.value === filters.academicAreaId)?.label ??
      t('filters.areaFallback').replace('{id}', filters.academicAreaId)
    )
  }, [academicAreaOptions.isLoading, academicAreaOptions.options, filters.academicAreaId, showAcademicArea, t])

  const contextText = selectedAcademicAreaLabel
    ? `${selectedProcessLabel} · ${selectedAcademicAreaLabel}`
    : selectedProcessLabel

  return (
    <section
      className={compact ? 'rounded-card border border-primary/15 bg-surface p-3 shadow-soft' : 'rounded-card border border-primary/15 bg-surface p-4 shadow-soft md:p-5'}
      aria-label={t('filters.globalAnalytics')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-primary/10 bg-background px-3 py-2.5">
        <p className="text-sm text-textSecondary">
          <span className="font-semibold text-textPrimary">{t('filters.showing')}</span>{' '}
          <span className="font-semibold text-primaryDark">{contextText}</span>
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-card px-2 text-sm font-medium text-textSecondary transition hover:text-primaryDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? t('filters.hide') : t('filters.change')}
          </button>
          <ResetGlobalFiltersButton hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
        </div>
      </div>

      {isEditing ? (
        <div className={compact ? 'mt-2 flex flex-col gap-2 md:flex-row md:items-end md:gap-3' : 'mt-3 flex flex-col gap-3 md:flex-row md:items-end md:gap-4'}>
          <ProcessSelector
            value={filters.processId}
            onChange={setProcessId}
            options={processOptions.options}
            isLoading={processOptions.isLoading}
            isError={processOptions.isError}
            errorMessage={processOptions.errorMessage}
          />
          {showAcademicArea ? (
            <AcademicAreaSelector
              value={filters.academicAreaId}
              onChange={setAcademicAreaId}
              options={academicAreaOptions.options}
              isLoading={academicAreaOptions.isLoading}
              isError={academicAreaOptions.isError}
              errorMessage={academicAreaOptions.errorMessage}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
