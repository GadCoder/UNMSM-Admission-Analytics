import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import type { SelectOption } from '../../../components/design-system'
import { httpClient } from '../../../lib/api'

type MajorResponse = {
  id: number
  name: string
  is_active: boolean
}

type UseResultsMajorOptionsResult = {
  options: SelectOption[]
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
  return 'Could not load major options. Please retry.'
}

export function useResultsMajorOptions(academicAreaId: number | null): UseResultsMajorOptionsResult {
  const query = useQuery({
    queryKey: ['results', 'major-options', academicAreaId],
    queryFn: async () => {
      const response = await httpClient.get<MajorResponse[]>('/majors', {
        params: academicAreaId === null ? undefined : { academic_area_id: academicAreaId },
      })

      return response.data
        .filter((item) => item.is_active)
        .map((item) => ({ value: String(item.id), label: item.name }))
        .sort((left, right) => left.label.localeCompare(right.label))
    },
  })

  return {
    options: query.data ?? [],
    isLoading: query.isPending,
    errorMessage: query.error ? getErrorMessage(query.error) : null,
  }
}
