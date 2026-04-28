import { describe, expect, it } from 'vitest'

import { i18n, setAppLocale } from './index'

describe('i18n runtime switching', () => {
  it('switches language at runtime without reloading the app', async () => {
    await setAppLocale('en')
    expect(i18n.language.startsWith('en')).toBe(true)

    await setAppLocale('es')
    expect(i18n.language.startsWith('es')).toBe(true)
  })

  it('returns key text when translation key is missing in all locales', async () => {
    await setAppLocale('en')
    expect(i18n.t('shell:groups.coreViews')).toBe('Core views')
    expect(i18n.t('shell:unknown.key')).toBe('unknown.key')
  })
})
