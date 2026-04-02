export type ResultsPageState = 'loading' | 'error' | 'empty' | 'ready'

type ResultsPageStateParams = {
  isLoading: boolean
  errorMessage: string | null
  rowCount: number
}

export function deriveResultsPageState(params: ResultsPageStateParams): ResultsPageState {
  if (params.isLoading) {
    return 'loading'
  }

  if (params.errorMessage) {
    return 'error'
  }

  if (params.rowCount === 0) {
    return 'empty'
  }

  return 'ready'
}
