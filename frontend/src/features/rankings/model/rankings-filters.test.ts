import { describe, expect, it } from 'vitest'

import type { SelectOption } from '../../../components/design-system'
import {
  buildProcessOptionsForYear,
  compareProcessRecency,
  deriveDefaultYear,
  getLatestProcessOption,
  resolveSelectedProcessId,
} from './rankings-filters'

const processOptions: SelectOption[] = [
  { value: '1', label: '2025-I' },
  { value: '2', label: '2025-II' },
  { value: '3', label: '2026-I' },
]

describe('rankings filters', () => {
  it('orders newer processes first', () => {
    const sorted = [...processOptions].sort(compareProcessRecency)
    expect(sorted.map((item) => item.label)).toEqual(['2026-I', '2025-II', '2025-I'])
  })

  it('resolves latest process fallback when no process is provided', () => {
    const filtered = buildProcessOptionsForYear(processOptions, '2026')
    const latest = getLatestProcessOption(processOptions)
    expect(resolveSelectedProcessId(null, filtered, latest)).toBe(3)
  })

  it('preserves explicit process if present in filtered options', () => {
    const filtered = buildProcessOptionsForYear(processOptions, '2025')
    const latest = getLatestProcessOption(processOptions)
    expect(resolveSelectedProcessId(2, filtered, latest)).toBe(2)
  })

  it('derives default year from explicit process first', () => {
    expect(deriveDefaultYear(processOptions, '2')).toBe('2025')
  })
})
