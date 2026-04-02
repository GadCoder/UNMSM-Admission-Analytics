import { useQueries, useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { httpClient } from '../../../lib/api'

type HierarchyContext = {
  id: number
  name: string
  slug: string
}

export type CompareMajorOption = {
  value: string
  label: string
}

type CompareMajorResponse = {
  id: number
  name: string
  is_active: boolean
}

type CompareMajorAnalytics = {
  major: {
    id: number
    name: string
    slug: string
    faculty: HierarchyContext
    academic_area: HierarchyContext
  }
  filters: {
    process_id: number | null
  }
  metrics: {
    applicants: number
    admitted: number
    acceptance_rate: number | null
  }
}

type CompareMajorTrends = {
  history: Array<{
    process: {
      id: number
      label: string
    }
    metrics: {
      applicants: number | null
      admitted: number | null
      acceptance_rate: number | null
    }
  }>
}

export type CompareEntityData = {
  key: string
  label: string
  analytics?: CompareMajorAnalytics
  trends?: CompareMajorTrends
  errorMessage?: string
  isLoading: boolean
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
  return 'Could not load compare data. Please retry.'
}

const MIN_COMPARE_QUERY_DELAY_MS = 180

async function withMinimumDelay<T>(operation: Promise<T>): Promise<T> {
  const [result] = await Promise.all([
    operation,
    new Promise((resolve) => setTimeout(resolve, MIN_COMPARE_QUERY_DELAY_MS)),
  ])
  return result
}

export function useCompareMajorOptions(academicAreaId: number | null) {
  const query = useQuery({
    queryKey: ['compare', 'major-options', academicAreaId],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const response = await httpClient.get<CompareMajorResponse[]>('/majors', {
        params: academicAreaId === null ? undefined : { academic_area_id: academicAreaId },
      })

      return response.data
        .filter((major) => major.is_active)
        .map((major) => ({ value: String(major.id), label: major.name }))
        .sort((left, right) => left.label.localeCompare(right.label))
    },
  })

  return {
    options: query.data ?? [],
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}

export function useCompareEntitiesData(selectedEntities: CompareMajorOption[], processId: number | null) {
  const analyticsQueries = useQueries({
    queries: selectedEntities.map((entity) => {
      const majorId = Number(entity.value)
      return {
        queryKey: ['compare', 'analytics', majorId, processId],
        queryFn: async () => {
          const response = await withMinimumDelay(
            httpClient.get<CompareMajorAnalytics>(`/majors/${majorId}/analytics`, {
              params: processId === null ? undefined : { process_id: processId },
            })
          )
          return response.data
        },
      }
    }),
  })

  const trendsQueries = useQueries({
    queries: selectedEntities.map((entity) => {
      const majorId = Number(entity.value)
      return {
        queryKey: ['compare', 'trends', majorId],
        queryFn: async () => {
          const response = await withMinimumDelay(
            httpClient.get<CompareMajorTrends>(`/majors/${majorId}/trends`, {
              params: { metrics: 'applicants,admitted,acceptance_rate' },
            })
          )
          return response.data
        },
      }
    }),
  })

  const entities: CompareEntityData[] = selectedEntities.map((entity, index) => {
    const analyticsQuery = analyticsQueries[index]
    const trendsQuery = trendsQueries[index]

    const analyticsError = analyticsQuery?.error ? getErrorMessage(analyticsQuery.error) : null
    const trendsError = trendsQuery?.error ? getErrorMessage(trendsQuery.error) : null

    return {
      key: entity.value,
      label: entity.label,
      analytics: analyticsQuery?.data,
      trends: trendsQuery?.data,
      errorMessage: analyticsError ?? trendsError ?? undefined,
      isLoading: Boolean(analyticsQuery?.isPending || trendsQuery?.isPending),
    }
  })

  return {
    entities,
    isLoading: entities.some((entity) => entity.isLoading),
  }
}
