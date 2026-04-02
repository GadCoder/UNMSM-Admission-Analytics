import type { PaginatedResultsResponse, ResultItemResponse } from '../api/results-api'

export type ResultsTableRow = {
  id: string
  candidateCode: string
  applicant: string
  major: string
  score: number
  status: string
}

export type ResultsHeaderModel = {
  title: string
  subtitle: string
  metadata: string
}

function formatApplicantName(item: ResultItemResponse): string {
  return `${item.candidate_lastnames}, ${item.candidate_names}`
}

export function mapResultItemsToRows(items: ResultItemResponse[]): ResultsTableRow[] {
  return items.map((item) => ({
    id: String(item.id),
    candidateCode: item.candidate_code,
    applicant: formatApplicantName(item),
    major: item.major?.name ?? '-',
    score: item.score,
    status: item.is_admitted ? 'Admitted' : 'Not admitted',
  }))
}

export function buildResultsHeaderModel(params: {
  data: PaginatedResultsResponse | undefined
  selectedProcessLabel: string
  selectedAcademicAreaLabel: string
}): ResultsHeaderModel {
  const firstItem = params.data?.items[0]
  const areaName = firstItem?.academic_area?.name ?? params.selectedAcademicAreaLabel
  const processLabel = firstItem?.process?.label ?? params.selectedProcessLabel
  const totalItems = params.data?.total ?? 0

  return {
    title: areaName ? `${areaName} Results` : 'Admission Results',
    subtitle: processLabel ? `Process ${processLabel}` : 'Current process scope',
    metadata: `${totalItems} candidates in current scope`,
  }
}
