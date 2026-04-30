import { describe, expect, it } from 'vitest'

import { PRIMARY_NAV_ITEMS, buildPrimaryNavGroups } from './navigation'

describe('layout navigation', () => {
  const translate = (key: string) => key

  it('keeps mobile/desktop primary route parity', () => {
    const groups = buildPrimaryNavGroups(translate)
    const groupedPaths = groups.flatMap((group) => group.items.map((item) => item.path))

    expect(groupedPaths).toEqual(PRIMARY_NAV_ITEMS.map((item) => item.path))
  })

  it('splits primary navigation into core and analytics groups', () => {
    const groups = buildPrimaryNavGroups(translate)

    expect(groups).toHaveLength(2)
    expect(groups[0]?.items).toHaveLength(3)
    expect(groups[1]?.items).toHaveLength(PRIMARY_NAV_ITEMS.length - 3)
  })
})
