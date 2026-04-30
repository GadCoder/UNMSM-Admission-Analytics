import { describe, expect, it } from 'vitest'

import { LOCALE_STORAGE_KEY } from './types'
import { clearStoredLocale, loadStoredLocale, resolveInitialLocale, saveStoredLocale } from './storage'

function createStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('i18n storage', () => {
  it('persists and restores locale preference', () => {
    const storage = createStorageMock()

    saveStoredLocale('en', storage)

    expect(loadStoredLocale(storage)).toBe('en')
    expect(resolveInitialLocale(storage)).toBe('en')
  })

  it('falls back to spanish for invalid stored locale', () => {
    const storage = createStorageMock()
    storage.setItem(LOCALE_STORAGE_KEY, 'pt')

    expect(resolveInitialLocale(storage)).toBe('es')
  })

  it('clears stored locale preference', () => {
    const storage = createStorageMock()
    saveStoredLocale('es', storage)

    clearStoredLocale(storage)

    expect(loadStoredLocale(storage)).toBeNull()
    expect(resolveInitialLocale(storage)).toBe('es')
  })
})
