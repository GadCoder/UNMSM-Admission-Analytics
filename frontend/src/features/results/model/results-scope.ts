type ProcessOption = {
  value: string
}

export function toOptionalInt(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function resolveResultsProcessId(processIdFromFilters: number | null, processOptions: ProcessOption[]): number | null {
  if (processIdFromFilters !== null) {
    return processIdFromFilters
  }

  const fallback = processOptions[0]?.value
  if (!fallback) {
    return null
  }

  const parsedFallback = Number(fallback)
  return Number.isInteger(parsedFallback) && parsedFallback > 0 ? parsedFallback : null
}
