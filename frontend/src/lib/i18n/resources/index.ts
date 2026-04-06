import { enMessages } from './en'
import { esMessages } from './es'
import type { TranslationResources } from '../types'

export const translationResources = {
  es: esMessages,
  en: enMessages,
} satisfies TranslationResources
