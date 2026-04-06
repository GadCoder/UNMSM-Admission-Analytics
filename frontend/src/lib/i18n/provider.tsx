import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { translationResources } from './resources'
import { resolveInitialLocale, saveStoredLocale, type StorageLike } from './storage'
import { resolveLocale, createTranslator } from './translator'
import { SUPPORTED_LOCALES, type SupportedLocale } from './types'

type I18nContextValue = {
  locale: SupportedLocale
  supportedLocales: readonly SupportedLocale[]
  setLocale: (nextLocale: string) => void
  t: (key: string) => string
}

const browserStorage: StorageLike | undefined = typeof window === 'undefined' ? undefined : window.localStorage

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => resolveInitialLocale(browserStorage))

  useEffect(() => {
    saveStoredLocale(locale, browserStorage)
  }, [locale])

  const setLocale = useCallback((nextLocale: string) => {
    setLocaleState(resolveLocale(nextLocale))
  }, [])

  const t = useMemo(() => createTranslator(translationResources, locale), [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      supportedLocales: SUPPORTED_LOCALES,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (context == null) {
    throw new Error('useI18n must be used inside I18nProvider')
  }

  return context
}
