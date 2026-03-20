import { GlobalFilterBar, useGlobalFilters } from '../features/global-filters'
import { ShellPlaceholderPage } from './shell-placeholder-page'

export function DashboardPage() {
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()

  return (
    <div className="space-y-5">
      <GlobalFilterBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        setProcessId={setProcessId}
        setAcademicAreaId={setAcademicAreaId}
        resetFilters={resetFilters}
      />

      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft md:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">Current Global Filters</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-card border border-primary/10 bg-background px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">Process ID</p>
            <p className="mt-1 text-sm font-medium text-textPrimary">{filters.processId ?? 'All processes'}</p>
          </div>
          <div className="rounded-card border border-primary/10 bg-background px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-textSecondary">Academic Area ID</p>
            <p className="mt-1 text-sm font-medium text-textPrimary">{filters.academicAreaId ?? 'All areas'}</p>
          </div>
        </div>
      </section>

      <ShellPlaceholderPage
        title="Dashboard"
        description="Dashboard widgets and analytics summaries will be added in a dedicated feature change."
      />
    </div>
  )
}
