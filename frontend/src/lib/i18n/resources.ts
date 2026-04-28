import { adminEn } from './locales/en/admin'
import { commonEn } from './locales/en/common'
import { shellEn } from './locales/en/shell'
import { adminEs } from './locales/es/admin'
import { commonEs } from './locales/es/common'
import { shellEs } from './locales/es/shell'

export const resources = {
  es: {
    common: commonEs,
    shell: shellEs,
    admin: adminEs,
  },
  en: {
    common: commonEn,
    shell: shellEn,
    admin: adminEn,
  },
} as const
