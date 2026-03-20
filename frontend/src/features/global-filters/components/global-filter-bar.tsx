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
}

export function GlobalFilterBar({
  filters,
  hasActiveFilters,
  setProcessId,
  setAcademicAreaId,
  resetFilters,
}: GlobalFilterBarProps) {
  const processOptions = useProcessOptions()
  const academicAreaOptions = useAcademicAreaOptions()

  return (
    <section
      className="rounded-card border border-primary/15 bg-surface p-4 shadow-soft md:p-5"
      aria-label="Global analytics filters"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
        <ProcessSelector
          value={filters.processId}
          onChange={setProcessId}
          options={processOptions.options}
          isLoading={processOptions.isLoading}
          isError={processOptions.isError}
          errorMessage={processOptions.errorMessage}
        />
        <AcademicAreaSelector
          value={filters.academicAreaId}
          onChange={setAcademicAreaId}
          options={academicAreaOptions.options}
          isLoading={academicAreaOptions.isLoading}
          isError={academicAreaOptions.isError}
          errorMessage={academicAreaOptions.errorMessage}
        />
        <ResetGlobalFiltersButton hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
      </div>
    </section>
  )
}
