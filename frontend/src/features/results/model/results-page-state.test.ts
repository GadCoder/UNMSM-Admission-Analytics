import { describe, expect, it } from 'vitest'

import { deriveResultsPageState } from './results-page-state'

describe('results page state', () => {
  it('returns loading when data is pending', () => {
    expect(
      deriveResultsPageState({
        isLoading: true,
        errorMessage: null,
        rowCount: 0,
      })
    ).toBe('loading')
  })

  it('returns error when request fails', () => {
    expect(
      deriveResultsPageState({
        isLoading: false,
        errorMessage: 'Request failed',
        rowCount: 3,
      })
    ).toBe('error')
  })

  it('returns empty when request succeeds with no rows', () => {
    expect(
      deriveResultsPageState({
        isLoading: false,
        errorMessage: null,
        rowCount: 0,
      })
    ).toBe('empty')
  })

  it('returns ready when rows exist', () => {
    expect(
      deriveResultsPageState({
        isLoading: false,
        errorMessage: null,
        rowCount: 5,
      })
    ).toBe('ready')
  })
})
