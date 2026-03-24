import { describe, expect, it } from 'vitest'

import { buildProcessOverrides, nextPollInterval } from './polling'

describe('admin imports polling model', () => {
  it('resets to fast polling when status changes', () => {
    expect(nextPollInterval(4_500, true)).toBe(2_000)
  })

  it('backs off polling when status does not change', () => {
    expect(nextPollInterval(2_000, false)).toBe(2_500)
    expect(nextPollInterval(5_000, false)).toBe(5_000)
  })

  it('only sends per-file process overrides different from default', () => {
    const overrides = buildProcessOverrides(['a.csv', 'b.csv'], 1, {
      'a.csv': 1,
      'b.csv': 2,
    })
    expect(overrides).toEqual({ 'b.csv': 2 })
  })
})
