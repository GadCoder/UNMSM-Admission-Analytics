import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { httpClient } from '../../../lib/api'
import type { FilterOption } from './filter-option-types'

type AcademicAreaResponse = {
  id: number
  name: string
  slug: string
}

type UseAcademicAreaOptionsResult = {
  options: FilterOption[]
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

async function fetchAcademicAreaOptions(): Promise<FilterOption[]> {
  const response = await httpClient.get<AcademicAreaResponse[]>('/areas')

  return response.data.map((areaItem) => ({
    value: String(areaItem.id),
    label: areaItem.name,
    slug: areaItem.slug,
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

  return 'Could not load academic area options. Please retry.'
}

export function useAcademicAreaOptions(): UseAcademicAreaOptionsResult {
  const query = useQuery({
    queryKey: ['global-filter', 'academic-area-options'],
    queryFn: fetchAcademicAreaOptions,
  })

  return {
    options: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}
