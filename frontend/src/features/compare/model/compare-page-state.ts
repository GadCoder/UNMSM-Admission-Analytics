export type ComparePageState = 'empty' | 'loading' | 'error' | 'partial' | 'ready'

type ComparePageStateParams = {
  selectedCount: number
  loadingCount: number
  successCount: number
  errorCount: number
}

export function deriveComparePageState(params: ComparePageStateParams): ComparePageState {
  if (params.selectedCount === 0) {
    return 'empty'
  }

  if (params.loadingCount > 0 && params.successCount === 0 && params.errorCount === 0) {
    return 'loading'
  }

  if (params.errorCount > 0 && params.successCount > 0) {
    return 'partial'
  }

  if (params.errorCount > 0 && params.successCount === 0) {
    return 'error'
  }

  return 'ready'
}
