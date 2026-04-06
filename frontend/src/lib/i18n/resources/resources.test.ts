import { describe, expect, it } from 'vitest'

import { translationResources } from './index'

describe('i18n resources', () => {
  it('keeps locale dictionaries aligned by key', () => {
    const localeEntries = Object.entries(translationResources)
    const referenceKeys = Object.keys(localeEntries[0]?.[1] ?? {}).sort()

    for (const [locale, dictionary] of localeEntries.slice(1)) {
      expect(Object.keys(dictionary).sort(), `translation keys mismatch in locale: ${locale}`).toEqual(referenceKeys)
    }
  })
})
