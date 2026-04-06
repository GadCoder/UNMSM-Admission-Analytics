import type { ChangeEvent, RefObject } from 'react'

import { Topbar as DesignSystemTopbar } from '../components/design-system'
import { useI18n } from '../lib/i18n'

type TopbarProps = {
  isMobileNavOpen: boolean
  onToggleMobileNav: () => void
  mobileMenuButtonRef: RefObject<HTMLButtonElement | null>
}

export function Topbar({ isMobileNavOpen, onToggleMobileNav, mobileMenuButtonRef }: TopbarProps) {
  const { locale, supportedLocales, setLocale, t } = useI18n()

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value)
  }

  return (
    <DesignSystemTopbar
      leading={
        <button
          ref={mobileMenuButtonRef}
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-card border border-primary/20 bg-background text-lg text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/70 md:hidden"
          aria-label={isMobileNavOpen ? t('shell.mobileMenu.closeLabel') : t('shell.mobileMenu.openLabel')}
          aria-controls="mobile-navigation"
          aria-expanded={isMobileNavOpen}
          onClick={onToggleMobileNav}
        >
          ☰
        </button>
      }
      actions={
        <label className="flex items-center gap-2 text-sm font-medium text-textPrimary" htmlFor="app-locale-selector">
          <span className="hidden sm:inline">{t('shell.languageLabel')}</span>
          <select
            id="app-locale-selector"
            value={locale}
            onChange={handleLocaleChange}
            className="max-w-28 rounded-card border border-primary/20 bg-background px-2 py-1 text-sm text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/70 sm:max-w-none"
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
