import { InlineMetricBadge, TrendIndicator, type ComparisonRow, type TrendDirection } from '../../../components/design-system'
import type { CompareEntityData, CompareMajorOption } from '../api/use-compare-data'

export const MAX_COMPARE_SELECTION = 5

export type SelectionLimitResult = {
  nextSelection: CompareMajorOption[]
  limitReached: boolean
}

function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-'
  }
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-'
  }
  return `${(value * 100).toFixed(1)}%`
}

function trendFromAcceptance(values: Array<number | null>): TrendDirection {
  const clean = values.filter((value): value is number => typeof value === 'number')
  if (clean.length < 2) {
    return 'neutral'
  }
  const latest = clean[clean.length - 1]
  const previous = clean[clean.length - 2]
  if (latest > previous) {
    return 'up'
  }
  if (latest < previous) {
    return 'down'
  }
  return 'neutral'
}

export function reconcileCompareSelection(
  selected: CompareMajorOption[],
  availableOptions: CompareMajorOption[]
): CompareMajorOption[] {
  const allowed = new Set(availableOptions.map((item) => item.value))
  return selected.filter((item) => allowed.has(item.value))
}

export function applySelectionLimit(nextSelection: CompareMajorOption[], max = MAX_COMPARE_SELECTION): SelectionLimitResult {
  if (nextSelection.length <= max) {
    return {
      nextSelection,
      limitReached: false,
    }
  }

  return {
    nextSelection: nextSelection.slice(0, max),
    limitReached: true,
  }
}

export function buildCompareRows(entities: CompareEntityData[]): ComparisonRow[] {
  return [
    {
      id: 'applicants',
      metric: 'Applicants',
      values: Object.fromEntries(
        entities.map((entity) => [
          entity.key,
          entity.analytics ? formatInteger(entity.analytics.metrics.applicants) : '-',
        ])
      ),
    },
    {
      id: 'admitted',
      metric: 'Admitted',
      values: Object.fromEntries(
        entities.map((entity) => [
          entity.key,
          entity.analytics ? formatInteger(entity.analytics.metrics.admitted) : '-',
        ])
      ),
    },
    {
      id: 'acceptance',
      metric: 'Acceptance Rate',
      values: Object.fromEntries(
        entities.map((entity) => {
          if (!entity.analytics) {
            return [entity.key, '-']
          }

          const rate = entity.analytics.metrics.acceptance_rate
          const value = formatPercent(rate)
          return [entity.key, <InlineMetricBadge key={`${entity.key}-acceptance`} value={value} positive={(rate ?? 0) >= 0.1} />]
        })
      ),
    },
    {
      id: 'trend',
      metric: 'Trend',
      values: Object.fromEntries(
        entities.map((entity) => {
          if (!entity.trends) {
            return [entity.key, '-']
          }

          const direction = trendFromAcceptance(entity.trends.history.map((item) => item.metrics.acceptance_rate))
          return [entity.key, <TrendIndicator key={`${entity.key}-trend`} direction={direction} />]
        })
      ),
    },
  ]
}
