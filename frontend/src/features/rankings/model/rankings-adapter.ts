import type { DashboardRankingItem } from '../../dashboard/api/use-dashboard-aggregates'

type RankingsListItem = {
  id: string
  label: string
  value: string
  description: string
  progress: number
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return '-'
  }
  return `${(value * 100).toFixed(1)}%`
}

function formatShare(value: number, total: number): string {
  if (total <= 0) {
    return '0.00%'
  }
  return `${((value / total) * 100).toFixed(2)}%`
}

export function buildCompetitiveRankingItems(items: DashboardRankingItem[]): RankingsListItem[] {
  const sorted = [...items].sort((left, right) => {
    if (left.acceptance_rate === null && right.acceptance_rate === null) {
      return right.applicants - left.applicants
    }
    if (left.acceptance_rate === null) {
      return 1
    }
    if (right.acceptance_rate === null) {
      return -1
    }
    if (left.acceptance_rate !== right.acceptance_rate) {
      return left.acceptance_rate - right.acceptance_rate
    }
    return right.applicants - left.applicants
  })

  return sorted.map((item) => ({
    id: String(item.major.id),
    label: item.major.name,
    value: `${formatPercent(item.acceptance_rate)} acceptance`,
    description: `${formatInteger(item.admitted)} admitted from ${formatInteger(item.applicants)} applicants`,
    progress:
      item.acceptance_rate === null
        ? 0
        : Math.max(0, Math.min(100, Math.round(item.acceptance_rate * 100))),
  }))
}

export function buildPopularRankingItems(items: DashboardRankingItem[]): RankingsListItem[] {
  const sorted = [...items].sort((left, right) => {
    if (left.applicants !== right.applicants) {
      return right.applicants - left.applicants
    }
    return right.admitted - left.admitted
  })
  const topApplicants = sorted[0]?.applicants ?? 0
  const totalApplicants = sorted.reduce((sum, item) => sum + item.applicants, 0)

  return sorted.map((item) => ({
    id: String(item.major.id),
    label: item.major.name,
    value: `${formatInteger(item.applicants)} applicants`,
    description: `${formatShare(item.applicants, totalApplicants)} of total applicants`,
    progress: topApplicants <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((item.applicants / topApplicants) * 100))),
  }))
}
