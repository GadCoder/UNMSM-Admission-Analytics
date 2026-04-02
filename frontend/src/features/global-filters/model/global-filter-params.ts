export const GLOBAL_FILTER_QUERY_KEYS = {
  processId: 'process_id',
  academicAreaId: 'academic_area_id',
} as const

export type GlobalFilters = {
  processId: string | null
  academicAreaId: string | null
}

const EMPTY_FILTERS: GlobalFilters = {
  processId: null,
  academicAreaId: null,
}

function normalizeFilterValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

export function parseGlobalFilters(params: URLSearchParams): GlobalFilters {
  return {
    processId: normalizeFilterValue(params.get(GLOBAL_FILTER_QUERY_KEYS.processId)),
    academicAreaId: normalizeFilterValue(params.get(GLOBAL_FILTER_QUERY_KEYS.academicAreaId)),
  }
}

export function serializeGlobalFilters(filters: Partial<GlobalFilters>): URLSearchParams {
  const params = new URLSearchParams()

  const processId = normalizeFilterValue(filters.processId)
  const academicAreaId = normalizeFilterValue(filters.academicAreaId)

  if (processId) {
    params.set(GLOBAL_FILTER_QUERY_KEYS.processId, processId)
  }

  if (academicAreaId) {
    params.set(GLOBAL_FILTER_QUERY_KEYS.academicAreaId, academicAreaId)
  }

  return params
}

export function updateGlobalFiltersInParams(
  params: URLSearchParams,
  updates: Partial<GlobalFilters>
): URLSearchParams {
  const nextParams = new URLSearchParams(params)

  if ('processId' in updates) {
    const processId = normalizeFilterValue(updates.processId)

    if (processId) {
      nextParams.set(GLOBAL_FILTER_QUERY_KEYS.processId, processId)
    } else {
      nextParams.delete(GLOBAL_FILTER_QUERY_KEYS.processId)
    }
  }

  if ('academicAreaId' in updates) {
    const academicAreaId = normalizeFilterValue(updates.academicAreaId)

    if (academicAreaId) {
      nextParams.set(GLOBAL_FILTER_QUERY_KEYS.academicAreaId, academicAreaId)
    } else {
      nextParams.delete(GLOBAL_FILTER_QUERY_KEYS.academicAreaId)
    }
  }

  return nextParams
}

export function resetGlobalFiltersInParams(params: URLSearchParams): URLSearchParams {
  return updateGlobalFiltersInParams(params, EMPTY_FILTERS)
}
