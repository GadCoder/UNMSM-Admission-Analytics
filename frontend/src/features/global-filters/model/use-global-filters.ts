import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  parseGlobalFilters,
  resetGlobalFiltersInParams,
  type GlobalFilters,
  updateGlobalFiltersInParams,
} from './global-filter-params'

export type UseGlobalFiltersResult = {
  filters: GlobalFilters
  hasActiveFilters: boolean
  setProcessId: (nextValue: string | null) => void
  setAcademicAreaId: (nextValue: string | null) => void
  updateFilters: (updates: Partial<GlobalFilters>) => void
  resetFilters: () => void
}

export function useGlobalFilters(): UseGlobalFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseGlobalFilters(searchParams), [searchParams])

  const updateFilters = useCallback(
    (updates: Partial<GlobalFilters>) => {
      setSearchParams((currentParams) => updateGlobalFiltersInParams(currentParams, updates), { replace: true })
    },
    [setSearchParams]
  )

  const setProcessId = useCallback(
    (nextValue: string | null) => {
      updateFilters({ processId: nextValue })
    },
    [updateFilters]
  )

  const setAcademicAreaId = useCallback(
    (nextValue: string | null) => {
      updateFilters({ academicAreaId: nextValue })
    },
    [updateFilters]
  )

  const resetFilters = useCallback(() => {
    setSearchParams((currentParams) => resetGlobalFiltersInParams(currentParams), { replace: true })
  }, [setSearchParams])

  return {
    filters,
    hasActiveFilters: Boolean(filters.processId || filters.academicAreaId),
    setProcessId,
    setAcademicAreaId,
    updateFilters,
    resetFilters,
  }
}
