import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '../components/design-system'
import { useAdminAuth } from '../features/admin-auth/model/use-admin-auth'

const adminSections = [
  { path: '/admin/processes', label: 'Processes' },
  { path: '/admin/areas', label: 'Areas' },
  { path: '/admin/faculties', label: 'Faculties' },
  { path: '/admin/majors', label: 'Majors' },
  { path: '/admin/imports', label: 'Imports' },
]

export function AdminShell() {
  const { logout } = useAdminAuth()

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primaryDark">Admin Console</p>
            <h1 className="mt-1 text-xl font-semibold text-textPrimary">Academic and import management</h1>
          </div>
          <Button type="button" variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Admin sections">
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
              {section.label}
            </NavLink>
          ))}
        </nav>
      </section>

      <Outlet />
    </div>
  )
}
