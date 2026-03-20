import { beforeEach, describe, expect, it, vi } from 'vitest'

import { debounce, getVisibleRange } from './multi-select-search-utils'

describe('multi-select-search utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('debounces successive calls', () => {
    const values: string[] = []
    const run = debounce((query: string) => values.push(query), 200)

    run('a')
    run('ab')
    run('abc')

    vi.advanceTimersByTime(199)
    expect(values).toHaveLength(0)

    vi.advanceTimersByTime(1)
    expect(values).toEqual(['abc'])
  })

  it('calculates virtualized visible range with overscan', () => {
    const range = getVisibleRange({
      scrollTop: 72,
      itemHeight: 36,
      viewportHeight: 180,
      total: 100,
      overscan: 2,
    })

    expect(range).toEqual({ start: 0, end: 9 })
  })
})
