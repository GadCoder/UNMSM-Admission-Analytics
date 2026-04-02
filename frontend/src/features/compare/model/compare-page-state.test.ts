import { describe, expect, it } from 'vitest'

import { deriveComparePageState } from './compare-page-state'

describe('compare page state', () => {
  it('returns empty when no entities are selected', () => {
    expect(
      deriveComparePageState({
        selectedCount: 0,
        loadingCount: 0,
        successCount: 0,
        errorCount: 0,
      })
    ).toBe('empty')
  })

  it('returns loading when selected entities are still loading', () => {
    expect(
      deriveComparePageState({
        selectedCount: 2,
        loadingCount: 2,
        successCount: 0,
        errorCount: 0,
      })
    ).toBe('loading')
  })

  it('returns error when all selected entities fail', () => {
    expect(
      deriveComparePageState({
        selectedCount: 2,
        loadingCount: 0,
        successCount: 0,
        errorCount: 2,
      })
    ).toBe('error')
  })

  it('returns partial when some entities fail and others succeed', () => {
    expect(
      deriveComparePageState({
        selectedCount: 3,
        loadingCount: 0,
        successCount: 2,
        errorCount: 1,
      })
    ).toBe('partial')
  })

  it('returns ready when entities resolve without failures', () => {
    expect(
      deriveComparePageState({
        selectedCount: 2,
        loadingCount: 0,
        successCount: 2,
        errorCount: 0,
      })
    ).toBe('ready')
  })
})
