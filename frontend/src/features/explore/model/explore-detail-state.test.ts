import { describe, expect, it } from 'vitest'

import { deriveExploreDetailState } from './explore-detail-state'

describe('explore detail state', () => {
  it('returns empty when hierarchy has no data', () => {
    expect(
      deriveExploreDetailState({
        selectedMajorId: null,
        analyticsLoading: false,
        trendsLoading: false,
        analyticsError: null,
        trendsError: null,
        hasHierarchyData: false,
      })
    ).toBe('empty')
  })

  it('returns select-major when a major is not selected', () => {
    expect(
      deriveExploreDetailState({
        selectedMajorId: null,
        analyticsLoading: false,
        trendsLoading: false,
        analyticsError: null,
        trendsError: null,
        hasHierarchyData: true,
      })
    ).toBe('select-major')
  })

  it('returns loading while any detail query is pending', () => {
    expect(
      deriveExploreDetailState({
        selectedMajorId: 12,
        analyticsLoading: true,
        trendsLoading: false,
        analyticsError: null,
        trendsError: null,
        hasHierarchyData: true,
      })
    ).toBe('loading')
  })

  it('returns error when any detail query fails', () => {
    expect(
      deriveExploreDetailState({
        selectedMajorId: 12,
        analyticsLoading: false,
        trendsLoading: false,
        analyticsError: 'boom',
        trendsError: null,
        hasHierarchyData: true,
      })
    ).toBe('error')
  })

  it('returns ready once selection is valid and data state is healthy', () => {
    expect(
      deriveExploreDetailState({
        selectedMajorId: 12,
        analyticsLoading: false,
        trendsLoading: false,
        analyticsError: null,
        trendsError: null,
        hasHierarchyData: true,
      })
    ).toBe('ready')
  })
})
