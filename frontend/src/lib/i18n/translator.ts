import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale, type TranslationResources } from './types'

const MISSING_TRANSLATION_PREFIX = '[missing:'

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value != null && SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

export function resolveLocale(
  value: string | null | undefined,
  fallbackLocale: SupportedLocale = DEFAULT_LOCALE,
): SupportedLocale {
  return isSupportedLocale(value) ? value : fallbackLocale
}

export function translate(
  resources: TranslationResources,
  locale: SupportedLocale,
  key: string,
  fallbackLocale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const activeValue = resources[locale][key]
  if (activeValue != null) {
    return activeValue
  }

  const fallbackValue = resources[fallbackLocale][key]
  if (fallbackValue != null) {
    return fallbackValue
  }

  return `${MISSING_TRANSLATION_PREFIX}${key}]`
}

export function createTranslator(
  resources: TranslationResources,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = DEFAULT_LOCALE,
): (key: string) => string {
  return (key) => translate(resources, locale, key, fallbackLocale)
}
