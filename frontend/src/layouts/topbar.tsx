import { Topbar as DesignSystemTopbar } from '../components/design-system'
import { useTranslation } from 'react-i18next'

import { setAppLocale } from '../lib/i18n'
import type { AppLocale } from '../lib/i18n/constants'

export function Topbar() {
  const { t, i18n } = useTranslation(['shell'])

  const activeLocale: AppLocale = i18n.language.startsWith('en') ? 'en' : 'es'

  return (
    <DesignSystemTopbar
      actions={
        <div className="flex w-full items-center justify-between gap-3">
          <input
            type="search"
            readOnly
            value=""
            placeholder={t('shell:topbar.searchPlaceholder')}
            className="h-9 w-full max-w-xs rounded-card border border-primary/20 bg-background px-3 text-sm text-textSecondary"
            aria-label={t('shell:topbar.searchPlaceholder')}
          />

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-textSecondary" htmlFor="app-language-selector">
              {t('shell:topbar.languageLabel')}
            </label>
            <select
              id="app-language-selector"
              className="h-9 rounded-card border border-primary/20 bg-background px-2 text-sm text-textPrimary"
              value={activeLocale}
              onChange={(event) => void setAppLocale(event.target.value as AppLocale)}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
            <span className="rounded-card border border-primary/20 bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wider text-textSecondary">
              {t('shell:topbar.globalControls')}
            </span>
          </div>
        </div>
      }
    />
  )
}
