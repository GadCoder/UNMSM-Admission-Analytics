type RankingsPageStateParams = {
  isLoading: boolean
  errorMessage: string | null
  competitiveCount: number
  popularCount: number
}

export type RankingsPageState = 'loading' | 'error' | 'empty' | 'ready'

export function deriveRankingsPageState(params: RankingsPageStateParams): RankingsPageState {
  if (params.isLoading) {
    return 'loading'
  }

  if (params.errorMessage) {
    return 'error'
  }

  if (params.competitiveCount === 0 && params.popularCount === 0) {
    return 'empty'
  }

  return 'ready'
}
