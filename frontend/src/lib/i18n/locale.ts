import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, type AppLocale } from './constants'

function normalizeLocale(locale: string): string {
  return locale.toLowerCase().split('-')[0]
}

export function isSupportedLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export function getStoredLocale(storage: Pick<Storage, 'getItem'>): AppLocale | null {
  const candidate = storage.getItem(LOCALE_STORAGE_KEY)
  if (!candidate) {
    return null
  }

  const normalized = normalizeLocale(candidate)
  return isSupportedLocale(normalized) ? normalized : null
}

export function resolveBrowserLocale(language: string | undefined): AppLocale | null {
  if (!language) {
    return null
  }
  const normalized = normalizeLocale(language)
  return isSupportedLocale(normalized) ? normalized : null
}

export function resolveInitialLocale(options: {
  storage: Pick<Storage, 'getItem'>
  browserLanguage?: string
}): AppLocale {
  const fromStorage = getStoredLocale(options.storage)
  if (fromStorage) {
    return fromStorage
  }

  const fromBrowser = resolveBrowserLocale(options.browserLanguage)
  if (fromBrowser) {
    return fromBrowser
  }

  return DEFAULT_LOCALE
}

export function saveLocalePreference(locale: AppLocale, storage: Pick<Storage, 'setItem'>) {
  storage.setItem(LOCALE_STORAGE_KEY, locale)
}
