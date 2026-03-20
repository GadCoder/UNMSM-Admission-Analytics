import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { httpClient } from '../../../lib/api'
import type { FilterOption } from './filter-option-types'

type ProcessResponse = {
  id: number
  label: string
}

type UseProcessOptionsResult = {
  options: FilterOption[]
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

async function fetchProcessOptions(): Promise<FilterOption[]> {
  const response = await httpClient.get<ProcessResponse[]>('/processes')

  return response.data.map((processItem) => ({
    value: String(processItem.id),
    label: processItem.label,
  }))
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data === 'string') {
      return error.response.data
    }

    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message
    }
  }

  return 'Could not load process options. Please retry.'
}

export function useProcessOptions(): UseProcessOptionsResult {
  const query = useQuery({
    queryKey: ['global-filter', 'process-options'],
    queryFn: fetchProcessOptions,
  })

  return {
    options: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}
