export const SUPPORTED_LOCALES = ['es', 'en'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'es'

export const LOCALE_STORAGE_KEY = 'unmsm.analytics.locale'

export type TranslationDictionary = Record<string, string>

export type TranslationResources = Record<SupportedLocale, TranslationDictionary>
