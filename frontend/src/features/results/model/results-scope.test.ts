import { describe, expect, it } from 'vitest'

import { resolveResultsProcessId, toOptionalInt } from './results-scope'

describe('results scope', () => {
  it('parses positive numeric ids from global filter values', () => {
    expect(toOptionalInt('8')).toBe(8)
  })

  it('normalizes invalid ids to null', () => {
    expect(toOptionalInt('')).toBeNull()
    expect(toOptionalInt('0')).toBeNull()
    expect(toOptionalInt('abc')).toBeNull()
  })

  it('keeps explicit process id when present in URL filters', () => {
    expect(resolveResultsProcessId(7, [{ value: '2' }, { value: '1' }])).toBe(7)
  })

  it('falls back to latest process option when URL process is missing', () => {
    expect(resolveResultsProcessId(null, [{ value: '12' }, { value: '11' }])).toBe(12)
  })
})
