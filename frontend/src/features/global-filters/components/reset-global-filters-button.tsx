import { useI18n } from '../../../lib/i18n'

type ResetGlobalFiltersButtonProps = {
  hasActiveFilters: boolean
  onReset: () => void
}

export function ResetGlobalFiltersButton({ hasActiveFilters, onReset }: ResetGlobalFiltersButtonProps) {
  const { t } = useI18n()

  if (!hasActiveFilters) {
    return null
  }

  return (
    <button
      type="button"
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-card px-2 text-sm font-medium text-textSecondary transition hover:text-primaryDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      onClick={onReset}
    >
      {t('filters.reset')}
    </button>
  )
}
