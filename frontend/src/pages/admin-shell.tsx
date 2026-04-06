import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '../components/design-system'
import { useAdminAuth } from '../features/admin-auth/model/use-admin-auth'
import { useI18n } from '../lib/i18n'

const adminSections = [
  { path: '/admin/processes', labelKey: 'admin.nav.processes' },
  { path: '/admin/areas', labelKey: 'admin.nav.areas' },
  { path: '/admin/faculties', labelKey: 'admin.nav.faculties' },
  { path: '/admin/majors', labelKey: 'admin.nav.majors' },
  { path: '/admin/imports', labelKey: 'admin.nav.imports' },
]

export function AdminShell() {
  const { logout } = useAdminAuth()
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primaryDark">{t('admin.consoleBadge')}</p>
            <h1 className="mt-1 text-xl font-semibold text-textPrimary">{t('admin.consoleTitle')}</h1>
          </div>
          <Button type="button" variant="ghost" onClick={logout}>
            {t('admin.logout')}
          </Button>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label={t('admin.sectionsAriaLabel')}>
          {adminSections.map((section) => (
            <NavLink
              key={section.path}
              to={section.path}
              className={({ isActive }) =>
                isActive
                  ? 'rounded-card border border-primary bg-primary px-3 py-1 text-sm text-white'
                  : 'rounded-card border border-primary/30 bg-white px-3 py-1 text-sm text-textSecondary'
              }
            >
              {t(section.labelKey)}
            </NavLink>
          ))}
        </nav>
      </section>

      <Outlet />
    </div>
  )
}
