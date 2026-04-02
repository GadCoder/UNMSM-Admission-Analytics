type ExploreDetailStateParams = {
  selectedMajorId: number | null
  analyticsLoading: boolean
  trendsLoading: boolean
  analyticsError: string | null
  trendsError: string | null
  hasHierarchyData: boolean
}

export type ExploreDetailState = 'select-major' | 'loading' | 'error' | 'ready' | 'empty'

export function deriveExploreDetailState(params: ExploreDetailStateParams): ExploreDetailState {
  if (!params.hasHierarchyData) {
    return 'empty'
  }

  if (params.selectedMajorId === null) {
    return 'select-major'
  }

  if (params.analyticsLoading || params.trendsLoading) {
    return 'loading'
  }

  if (params.analyticsError || params.trendsError) {
    return 'error'
  }

  return 'ready'
}
