import { NavLink } from 'react-router-dom'

import { useI18n } from '../lib/i18n'
import { buildPrimaryNavGroups } from './navigation'

type MobileNavDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { t } = useI18n()
  const navGroups = buildPrimaryNavGroups(t)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-textPrimary/45"
        aria-label={t('shell.mobileMenu.backdropLabel')}
        onClick={onClose}
      />

      <aside
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label={t('shell.mobileMenu.panelLabel')}
        className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-primary/10 bg-surface p-4 shadow-lg"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t('shell.brandSubtitle')}</p>
            <h2 className="mt-1 text-base font-semibold text-textPrimary">{t('shell.brandTitle')}</h2>
          </div>
          <button
            id="mobile-nav-close"
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-card border border-primary/20 bg-background text-lg text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            aria-label={t('shell.mobileMenu.closeLabel')}
            onClick={onClose}
            autoFocus
          >
            ×
          </button>
        </div>

        <nav aria-label={t('shell.primaryNavigationAriaLabel')} className="space-y-4">
          {navGroups.map((group) => (
            <section key={group.label}>
              <p className="mb-2 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-textSecondary/80">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        'group flex items-center gap-3 rounded-card px-2 py-2 text-sm font-medium outline-none transition-colors',
                        'focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                        isActive
                          ? 'bg-primary/12 text-primaryDark shadow-soft'
                          : 'text-textSecondary hover:bg-primary/6 hover:text-textPrimary',
                      ].join(' ')
                    }
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/15 bg-background text-[0.65rem] font-semibold tracking-wide">
                      {item.short}
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>
    </div>
  )
}
