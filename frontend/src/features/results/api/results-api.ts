import { httpClient } from '../../../lib/api'

export type ResultsSortBy = 'score' | 'merit_rank' | 'candidate_lastnames' | 'candidate_names'
export type ResultsSortOrder = 'asc' | 'desc'

type HierarchyContext = {
  id: number
  name: string
  slug: string
}

type ProcessContext = {
  id: number
  year: number
  cycle: string
  label: string
}

export type ResultItemResponse = {
  id: number
  candidate_code: string
  candidate_lastnames: string
  candidate_names: string
  score: number
  merit_rank: number | null
  observation_raw: string | null
  is_admitted: boolean
  row_number: number | null
  process: ProcessContext | null
  major: HierarchyContext | null
  faculty: HierarchyContext | null
  academic_area: HierarchyContext | null
}

export type PaginatedResultsResponse = {
  items: ResultItemResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type ResultsQueryInput = {
  processId: number
  academicAreaId: number | null
  majorId: number | null
  candidateName: string
  page: number
  pageSize?: number
  sortBy?: ResultsSortBy
  sortOrder?: ResultsSortOrder
}

export function buildResultsRequestParams(input: ResultsQueryInput) {
  const params: Record<string, string | number> = {
    process_id: input.processId,
    page: input.page,
    page_size: input.pageSize ?? 20,
    sort_by: input.sortBy ?? 'score',
    sort_order: input.sortOrder ?? 'desc',
  }

  if (input.academicAreaId !== null) {
    params.academic_area_id = input.academicAreaId
  }

  if (input.majorId !== null) {
    params.major_id = input.majorId
  }

  const normalizedName = input.candidateName.trim()
  if (normalizedName.length > 0) {
    params.candidate_name = normalizedName
  }

  return params
}

export async function fetchResults(input: ResultsQueryInput): Promise<PaginatedResultsResponse> {
  const response = await httpClient.get<PaginatedResultsResponse>('/results', {
    params: buildResultsRequestParams(input),
  })

  return response.data
}
