import type { ChangeEvent } from 'react'

import { Topbar as DesignSystemTopbar } from '../components/design-system'
import { useI18n } from '../lib/i18n'

export function Topbar() {
  const { locale, supportedLocales, setLocale, t } = useI18n()

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value)
  }

  return (
    <DesignSystemTopbar
      actions={
        <label className="flex items-center gap-2 text-sm font-medium text-textPrimary" htmlFor="app-locale-selector">
          <span>{t('shell.languageLabel')}</span>
          <select
            id="app-locale-selector"
            value={locale}
            onChange={handleLocaleChange}
            className="rounded-card border border-primary/20 bg-background px-2 py-1 text-sm text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            {supportedLocales.map((optionLocale) => (
              <option key={optionLocale} value={optionLocale}>
                {t(`shell.languageOption.${optionLocale}`)}
              </option>
            ))}
          </select>
        </label>
      }
    />
  )
}
