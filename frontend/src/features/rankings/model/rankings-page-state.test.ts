import { describe, expect, it } from 'vitest'

import { deriveRankingsPageState } from './rankings-page-state'

describe('rankings page state', () => {
  it('returns loading while queries are pending', () => {
    expect(
      deriveRankingsPageState({
        isLoading: true,
        errorMessage: null,
        competitiveCount: 0,
        popularCount: 0,
      })
    ).toBe('loading')
  })

  it('returns error when query failures exist', () => {
    expect(
      deriveRankingsPageState({
        isLoading: false,
        errorMessage: 'Could not load rankings',
        competitiveCount: 2,
        popularCount: 2,
      })
    ).toBe('error')
  })

  it('returns empty when ranking datasets are empty', () => {
    expect(
      deriveRankingsPageState({
        isLoading: false,
        errorMessage: null,
        competitiveCount: 0,
        popularCount: 0,
      })
    ).toBe('empty')
  })

  it('returns ready when at least one ranking panel has data', () => {
    expect(
      deriveRankingsPageState({
        isLoading: false,
        errorMessage: null,
        competitiveCount: 3,
        popularCount: 0,
      })
    ).toBe('ready')
  })
})
