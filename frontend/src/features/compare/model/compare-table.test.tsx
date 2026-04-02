import { describe, expect, it } from 'vitest'

import type { CompareEntityData, CompareMajorOption } from '../api/use-compare-data'
import { MAX_COMPARE_SELECTION, applySelectionLimit, buildCompareRows, reconcileCompareSelection } from './compare-table'

describe('compare table model', () => {
  it('reconciles stale selections against available options', () => {
    const selected: CompareMajorOption[] = [
      { value: '1', label: 'Medicine' },
      { value: '9', label: 'Unknown' },
    ]
    const available: CompareMajorOption[] = [{ value: '1', label: 'Medicine' }]

    expect(reconcileCompareSelection(selected, available)).toEqual([{ value: '1', label: 'Medicine' }])
  })

  it('applies max compare selection limit', () => {
    const nextSelection: CompareMajorOption[] = Array.from({ length: MAX_COMPARE_SELECTION + 2 }, (_, index) => ({
      value: String(index + 1),
      label: `Major ${index + 1}`,
    }))

    const result = applySelectionLimit(nextSelection)
    expect(result.limitReached).toBe(true)
    expect(result.nextSelection).toHaveLength(MAX_COMPARE_SELECTION)
  })

  it('builds comparison rows from analytics and trend data', () => {
    const entities: CompareEntityData[] = [
      {
        key: '1',
        label: 'Medicine',
        isLoading: false,
        analytics: {
          major: {
            id: 1,
            name: 'Medicine',
            slug: 'medicine',
            faculty: { id: 1, name: 'Health', slug: 'health' },
            academic_area: { id: 1, name: 'Health Sciences', slug: 'health-sciences' },
          },
          filters: { process_id: 2 },
          metrics: {
            applicants: 2500,
            admitted: 75,
            acceptance_rate: 0.03,
          },
        },
        trends: {
          history: [
            { process: { id: 1, label: '2024-I' }, metrics: { applicants: 2000, admitted: 40, acceptance_rate: 0.02 } },
            { process: { id: 2, label: '2025-I' }, metrics: { applicants: 2500, admitted: 75, acceptance_rate: 0.03 } },
          ],
        },
      },
      {
        key: '2',
        label: 'Law',
        isLoading: false,
      },
    ]

    const rows = buildCompareRows(entities)

    expect(rows.map((row) => row.id)).toEqual(['applicants', 'admitted', 'acceptance', 'trend'])
    expect(rows[0]?.values['1']).toBe('2,500')
    expect(rows[0]?.values['2']).toBe('-')
    expect(rows[2]?.values['1']).not.toBe('-')
    expect(rows[3]?.values['1']).not.toBe('-')
  })
})
