import { describe, expect, it } from 'vitest'

import {
  GLOBAL_FILTER_QUERY_KEYS,
  parseGlobalFilters,
  resetGlobalFiltersInParams,
  serializeGlobalFilters,
  updateGlobalFiltersInParams,
} from './global-filter-params'

describe('global-filter-params', () => {
  it('parses managed filter ids from query params', () => {
    const filters = parseGlobalFilters(new URLSearchParams('process_id=4&academic_area_id=9'))

    expect(filters).toEqual({
      processId: '4',
      academicAreaId: '9',
    })
  })

  it('normalizes empty values to null while parsing', () => {
    const filters = parseGlobalFilters(new URLSearchParams('process_id=&academic_area_id=   '))

    expect(filters).toEqual({
      processId: null,
      academicAreaId: null,
    })
  })

  it('serializes only non-empty managed filter values', () => {
    const serialized = serializeGlobalFilters({
      processId: '12',
      academicAreaId: '',
    })

    expect(serialized.get(GLOBAL_FILTER_QUERY_KEYS.processId)).toBe('12')
    expect(serialized.has(GLOBAL_FILTER_QUERY_KEYS.academicAreaId)).toBe(false)
  })

  it('updates managed params and preserves unrelated query params', () => {
    const updated = updateGlobalFiltersInParams(
      new URLSearchParams('sort_by=score&page=2&candidate_name=ana&process_id=2'),
      { processId: '10', academicAreaId: '7' }
    )

    expect(updated.get('sort_by')).toBe('score')
    expect(updated.get('page')).toBe('2')
    expect(updated.get('candidate_name')).toBe('ana')
    expect(updated.get(GLOBAL_FILTER_QUERY_KEYS.processId)).toBe('10')
    expect(updated.get(GLOBAL_FILTER_QUERY_KEYS.academicAreaId)).toBe('7')
  })

  it('resets managed params without touching unrelated params', () => {
    const reset = resetGlobalFiltersInParams(
      new URLSearchParams('sort=desc&process_id=2&academic_area_id=9&tab=overview')
    )

    expect(reset.get('sort')).toBe('desc')
    expect(reset.get('tab')).toBe('overview')
    expect(reset.has(GLOBAL_FILTER_QUERY_KEYS.processId)).toBe(false)
    expect(reset.has(GLOBAL_FILTER_QUERY_KEYS.academicAreaId)).toBe(false)
  })
})
