import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { httpClient } from '../../../lib/api'

type HierarchyContext = {
  id: number
  name: string
  slug: string
}

export type ExploreMajor = {
  id: number
  name: string
  slug: string
  is_active: boolean
  faculty: HierarchyContext
  academic_area: HierarchyContext
}

type MajorAnalyticsMetrics = {
  applicants: number
  admitted: number
  acceptance_rate: number | null
  max_score: number | null
  min_score: number | null
  avg_score: number | null
  median_score: number | null
  cutoff_score: number | null
}

type MajorAnalyticsFilters = {
  process_id: number | null
}

type MajorAnalyticsMajor = {
  id: number
  name: string
  slug: string
  faculty: HierarchyContext
  academic_area: HierarchyContext
}

export type ExploreMajorAnalytics = {
  major: MajorAnalyticsMajor
  filters: MajorAnalyticsFilters
  metrics: MajorAnalyticsMetrics
}

type ProcessContext = {
  id: number
  year: number
  cycle: string
  label: string
}

export type TrendMetricName =
  | 'applicants'
  | 'admitted'
  | 'acceptance_rate'
  | 'max_score'
  | 'min_score'
  | 'avg_score'
  | 'median_score'
  | 'cutoff_score'

export type ExploreMajorTrendItem = {
  process: ProcessContext
  metrics: Record<TrendMetricName, number | null>
}

export type ExploreMajorTrends = {
  major: MajorAnalyticsMajor
  metrics: TrendMetricName[]
  history: ExploreMajorTrendItem[]
}

type QueryResult<T> = {
  data: T | undefined
  isLoading: boolean
  errorMessage: string | null
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
  return 'Could not load explore data. Please retry.'
}

export function useExploreMajors(academicAreaId: number | null): QueryResult<ExploreMajor[]> {
  const query = useQuery({
    queryKey: ['explore', 'majors', academicAreaId],
    queryFn: async () => {
      const response = await httpClient.get<ExploreMajor[]>('/majors', {
        params: academicAreaId === null ? undefined : { academic_area_id: academicAreaId },
      })
      return response.data.filter((item) => item.is_active)
    },
  })

  return {
    data: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}

export function useExploreMajorAnalytics(majorId: number | null, processId: number | null): QueryResult<ExploreMajorAnalytics> {
  const query = useQuery({
    queryKey: ['explore', 'major-analytics', majorId, processId],
    enabled: majorId !== null,
    queryFn: async () => {
      const response = await httpClient.get<ExploreMajorAnalytics>(`/majors/${majorId}/analytics`, {
        params: processId === null ? undefined : { process_id: processId },
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

export function useExploreMajorTrends(majorId: number | null, metrics: TrendMetricName[]): QueryResult<ExploreMajorTrends> {
  const query = useQuery({
    queryKey: ['explore', 'major-trends', majorId, metrics.join(',')],
    enabled: majorId !== null,
    queryFn: async () => {
      const response = await httpClient.get<ExploreMajorTrends>(`/majors/${majorId}/trends`, {
        params: {
          metrics: metrics.join(','),
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
