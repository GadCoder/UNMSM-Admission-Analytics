import { describe, expect, it } from 'vitest'

import { createTranslator, resolveLocale, translate } from './translator'
import { translationResources } from './resources'

describe('i18n translator', () => {
  it('uses spanish as default when locale is missing or invalid', () => {
    expect(resolveLocale(undefined)).toBe('es')
    expect(resolveLocale(null)).toBe('es')
    expect(resolveLocale('pt')).toBe('es')
  })

  it('translates using active locale and supports runtime locale changes', () => {
    const spanishTranslator = createTranslator(translationResources, 'es')
    const englishTranslator = createTranslator(translationResources, 'en')

    expect(spanishTranslator('shell.languageLabel')).toBe('Idioma')
    expect(englishTranslator('shell.languageLabel')).toBe('Language')
  })

  it('falls back to default locale for missing key in active locale', () => {
    const enWithoutTrends = Object.fromEntries(
      Object.entries(translationResources.en).filter(([key]) => key !== 'shell.nav.trends'),
    )

    const resources = {
      ...translationResources,
      en: enWithoutTrends,
    }

    expect(translate(resources, 'en', 'shell.nav.trends')).toBe('Tendencias')
  })

  it('returns deterministic missing token when key is absent in all locales', () => {
    expect(translate(translationResources, 'en', 'shell.nav.unknown')).toBe('[missing:shell.nav.unknown]')
  })
})
