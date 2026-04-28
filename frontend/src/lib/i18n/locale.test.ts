import { describe, expect, it } from 'vitest'

import { LOCALE_STORAGE_KEY } from './constants'
import { getStoredLocale, resolveInitialLocale, saveLocalePreference } from './locale'

function createStorageMock(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe('locale resolution', () => {
  it('defaults to Spanish when there is no stored or browser locale', () => {
    const storage = createStorageMock()
    expect(resolveInitialLocale({ storage, browserLanguage: undefined })).toBe('es')
  })

  it('uses stored locale before browser locale', () => {
    const storage = createStorageMock({ [LOCALE_STORAGE_KEY]: 'en' })
    expect(resolveInitialLocale({ storage, browserLanguage: 'es-PE' })).toBe('en')
  })

  it('uses browser locale when storage is empty and browser locale is supported', () => {
    const storage = createStorageMock()
    expect(resolveInitialLocale({ storage, browserLanguage: 'en-US' })).toBe('en')
  })

  it('ignores unsupported stored locale values', () => {
    const storage = createStorageMock({ [LOCALE_STORAGE_KEY]: 'pt-BR' })
    expect(getStoredLocale(storage)).toBeNull()
    expect(resolveInitialLocale({ storage, browserLanguage: undefined })).toBe('es')
  })

  it('persists selected locale', () => {
    const storage = createStorageMock()
    saveLocalePreference('en', storage)
    expect(storage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
  })
})
