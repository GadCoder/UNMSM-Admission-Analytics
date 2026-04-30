import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type SupportedLocale } from './types'
import { resolveLocale } from './translator'

export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function loadStoredLocale(storage?: StorageLike): string | null {
  if (storage == null) {
    return null
  }

  try {
    return storage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveStoredLocale(locale: SupportedLocale, storage?: StorageLike): void {
  if (storage == null) {
    return
  }

  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore storage failures and keep runtime locale in memory.
  }
}

export function clearStoredLocale(storage?: StorageLike): void {
  if (storage == null) {
    return
  }

  try {
    storage.removeItem(LOCALE_STORAGE_KEY)
  } catch {
    // Ignore storage failures and keep runtime locale in memory.
  }
}

export function resolveInitialLocale(storage?: StorageLike): SupportedLocale {
  return resolveLocale(loadStoredLocale(storage), DEFAULT_LOCALE)
}
