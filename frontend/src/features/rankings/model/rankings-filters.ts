import type { SelectOption } from '../../../components/design-system'

type ProcessCycle = 'I' | 'II'

type ParsedProcessLabel = {
  year: string
  cycle: ProcessCycle
}

export function parseProcessLabel(label: string): ParsedProcessLabel | null {
  const match = /^(\d{4})-(I|II)$/i.exec(label.trim())
  if (!match) {
    return null
  }

  return { year: match[1], cycle: match[2].toUpperCase() as ProcessCycle }
}

export function compareProcessRecency(left: SelectOption, right: SelectOption): number {
  const leftParsed = parseProcessLabel(left.label)
  const rightParsed = parseProcessLabel(right.label)

  if (!leftParsed || !rightParsed) {
    return right.label.localeCompare(left.label)
  }

  const yearDelta = Number(rightParsed.year) - Number(leftParsed.year)
  if (yearDelta !== 0) {
    return yearDelta
  }

  const cycleOrder: Record<ProcessCycle, number> = { I: 0, II: 1 }
  return cycleOrder[rightParsed.cycle] - cycleOrder[leftParsed.cycle]
}

export function buildYearOptions(processOptions: SelectOption[]): SelectOption[] {
  const years = new Set<string>()
  processOptions.forEach((option) => {
    const parsed = parseProcessLabel(option.label)
    if (parsed) {
      years.add(parsed.year)
    }
  })

  return [...years]
    .sort((left, right) => Number(right) - Number(left))
    .map((year) => ({ value: year, label: year }))
}

export function buildProcessOptionsForYear(processOptions: SelectOption[], year: string): SelectOption[] {
  return processOptions
    .filter((option) => parseProcessLabel(option.label)?.year === year)
    .sort(compareProcessRecency)
}

export function getLatestProcessOption(processOptions: SelectOption[]): SelectOption | null {
  const sorted = [...processOptions].sort(compareProcessRecency)
  return sorted[0] ?? null
}

export function deriveDefaultYear(processOptions: SelectOption[], explicitProcessId: string | null): string {
  if (explicitProcessId) {
    const explicitProcess = processOptions.find((option) => option.value === explicitProcessId)
    const parsed = explicitProcess ? parseProcessLabel(explicitProcess.label) : null
    if (parsed) {
      return parsed.year
    }
  }

  const latest = getLatestProcessOption(processOptions)
  const latestParsed = latest ? parseProcessLabel(latest.label) : null
  return latestParsed?.year ?? ''
}

export function resolveSelectedProcessId(
  processIdFromFilters: number | null,
  filteredProcessOptions: SelectOption[],
  latestProcessOption: SelectOption | null
): number | null {
  if (
    processIdFromFilters !== null &&
    filteredProcessOptions.some((option) => option.value === String(processIdFromFilters))
  ) {
    return processIdFromFilters
  }

  const fallback = filteredProcessOptions[0]?.value ?? latestProcessOption?.value ?? null
  if (!fallback) {
    return null
  }

  const parsed = Number(fallback)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
