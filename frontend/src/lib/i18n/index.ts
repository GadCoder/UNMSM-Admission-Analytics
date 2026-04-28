import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { DEFAULT_LOCALE, type AppLocale } from './constants'
import { resolveInitialLocale, saveLocalePreference } from './locale'
import { resources } from './resources'

const inBrowser = typeof window !== 'undefined'

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
}

const storage = inBrowser ? window.localStorage : memoryStorage

const initialLocale = resolveInitialLocale({
  storage,
  browserLanguage: inBrowser ? window.navigator.language : undefined,
})

void i18next.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ['es', 'en'],
  defaultNS: 'common',
  ns: ['common', 'shell', 'admin'],
  interpolation: {
    escapeValue: false,
  },
  returnEmptyString: false,
})

i18next.on('languageChanged', (locale) => {
  if (locale === 'es' || locale === 'en') {
    saveLocalePreference(locale, storage)
  }
})

export const i18n = i18next

export async function setAppLocale(locale: AppLocale) {
  await i18next.changeLanguage(locale)
}
