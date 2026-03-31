import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { httpClient } from '../../../lib/api'

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

type DashboardAppliedFilters = {
  process_id: number | null
  academic_area_id: number | null
  faculty_id: number | null
  limit: number | null
}

type DashboardOverviewMetrics = {
  total_applicants: number
  total_admitted: number
  acceptance_rate: number
  total_majors: number
}

export type DashboardOverviewResponse = {
  filters: DashboardAppliedFilters
  metrics: DashboardOverviewMetrics
}

export type DashboardRankingItem = {
  rank: number
  major: HierarchyContext
  faculty: HierarchyContext
  academic_area: HierarchyContext
  applicants: number
  admitted: number
  acceptance_rate: number | null
  cutoff_score: number | null
}

export type DashboardRankingsResponse = {
  filters: DashboardAppliedFilters
  most_competitive: DashboardRankingItem[]
  most_popular: DashboardRankingItem[]
}

type DashboardApplicantsTrendItem = {
  process: ProcessContext
  applicants: number
}

export type DashboardApplicantsTrendResponse = {
  filters: DashboardAppliedFilters
  items: DashboardApplicantsTrendItem[]
}

type DashboardCutoffTrendItem = {
  process: ProcessContext
  avg_cutoff_score: number | null
}

export type DashboardCutoffTrendResponse = {
  filters: DashboardAppliedFilters
  items: DashboardCutoffTrendItem[]
}

export type DashboardScopeParams = {
  processId: number | null
  academicAreaId: number | null
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim() !== '') {
      return detail
    }
    if (typeof error.message === 'string' && error.message.trim() !== '') {
      return error.message
    }
  }
  return 'Could not load dashboard data. Please retry.'
}

function buildScopedParams(params: DashboardScopeParams) {
  const queryParams: Record<string, number> = {}
  if (params.processId !== null) {
    queryParams.process_id = params.processId
  }
  if (params.academicAreaId !== null) {
    queryParams.academic_area_id = params.academicAreaId
  }
  return queryParams
}

export function useDashboardOverview(params: DashboardScopeParams) {
  const query = useQuery({
    queryKey: ['dashboard', 'overview', params.processId, params.academicAreaId],
    enabled: params.processId !== null,
    queryFn: async () => {
      const response = await httpClient.get<DashboardOverviewResponse>('/dashboard/overview', {
        params: buildScopedParams(params),
      })
      return response.data
    },
  })

  return {
    data: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}

export function useDashboardRankings(params: DashboardScopeParams, limit = 5) {
  const query = useQuery({
    queryKey: ['dashboard', 'rankings', params.processId, params.academicAreaId, limit],
    enabled: params.processId !== null,
    queryFn: async () => {
      const response = await httpClient.get<DashboardRankingsResponse>('/dashboard/rankings', {
        params: {
          ...buildScopedParams(params),
          limit,
        },
      })
      return response.data
    },
  })

  return {
    data: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}

export function useDashboardApplicantsTrend(academicAreaId: number | null) {
  const query = useQuery({
    queryKey: ['dashboard', 'trends', 'applicants', academicAreaId],
    queryFn: async () => {
      const response = await httpClient.get<DashboardApplicantsTrendResponse>('/dashboard/trends/applicants', {
        params: academicAreaId === null ? undefined : { academic_area_id: academicAreaId },
      })
      return response.data
    },
  })

  return {
    data: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}

export function useDashboardCutoffTrend(academicAreaId: number | null) {
  const query = useQuery({
    queryKey: ['dashboard', 'trends', 'cutoff', academicAreaId],
    queryFn: async () => {
      const response = await httpClient.get<DashboardCutoffTrendResponse>('/dashboard/trends/cutoff', {
        params: academicAreaId === null ? undefined : { academic_area_id: academicAreaId },
      })
      return response.data
    },
  })

  return {
    data: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}
