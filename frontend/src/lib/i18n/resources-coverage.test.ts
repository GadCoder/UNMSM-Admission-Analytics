import { describe, expect, it } from 'vitest'

import { resources } from './resources'

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix]
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return flattenKeys(nested, nextPrefix)
  })
}

describe('i18n resources coverage', () => {
  it('keeps Spanish and English namespaces aligned', () => {
    const namespaces = Object.keys(resources.es)

    for (const namespace of namespaces) {
      const esKeys = flattenKeys(resources.es[namespace as keyof typeof resources.es]).sort()
      const enKeys = flattenKeys(resources.en[namespace as keyof typeof resources.en]).sort()

      expect(enKeys).toEqual(esKeys)
    }
  })
})
