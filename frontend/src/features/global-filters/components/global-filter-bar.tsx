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
  const processOptions = useProcessOptions()
  const academicAreaOptions = useAcademicAreaOptions()

  return (
    <section
      className={compact ? 'rounded-card border border-primary/15 bg-surface p-3 shadow-soft' : 'rounded-card border border-primary/15 bg-surface p-4 shadow-soft md:p-5'}
      aria-label="Global analytics filters"
    >
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
        <div className="self-start md:self-end">
          <ResetGlobalFiltersButton hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
        </div>
      </div>
    </section>
  )
}
