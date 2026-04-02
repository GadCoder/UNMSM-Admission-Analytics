import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { fetchResults, type PaginatedResultsResponse, type ResultsQueryInput } from './results-api'

type UseResultsQueryInput = {
  processId: number | null
  academicAreaId: number | null
  majorId: number | null
  candidateName: string
  page: number
}

type UseResultsQueryResult = {
  data: PaginatedResultsResponse | undefined
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
  return 'Could not load results data. Please retry.'
}

export function useResultsQuery(input: UseResultsQueryInput): UseResultsQueryResult {
  const query = useQuery({
    queryKey: ['results', input.processId, input.academicAreaId, input.majorId, input.candidateName.trim(), input.page],
    placeholderData: (previousData) => previousData,
    enabled: input.processId !== null,
    queryFn: async () => {
      const queryInput: ResultsQueryInput = {
        processId: input.processId as number,
        academicAreaId: input.academicAreaId,
        majorId: input.majorId,
        candidateName: input.candidateName,
        page: input.page,
      }
      return fetchResults(queryInput)
    },
  })

  return {
    data: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}
