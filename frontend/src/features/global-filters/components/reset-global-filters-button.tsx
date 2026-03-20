type ResetGlobalFiltersButtonProps = {
  hasActiveFilters: boolean
  onReset: () => void
}

export function ResetGlobalFiltersButton({ hasActiveFilters, onReset }: ResetGlobalFiltersButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-card border border-primary/20 bg-white px-4 text-sm font-medium text-primaryDark shadow-soft transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onReset}
      disabled={!hasActiveFilters}
    >
      Reset filters
    </button>
  )
}
