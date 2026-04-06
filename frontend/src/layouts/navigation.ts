export type PrimaryNavItem = {
  labelKey: string
  path: string
  short: string
}

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { labelKey: 'shell.nav.dashboard', path: '/dashboard', short: 'DB' },
  { labelKey: 'shell.nav.explore', path: '/explore', short: 'EX' },
  { labelKey: 'shell.nav.compare', path: '/compare', short: 'CP' },
  { labelKey: 'shell.nav.rankings', path: '/rankings', short: 'RK' },
  { labelKey: 'shell.nav.results', path: '/results', short: 'RS' },
  { labelKey: 'shell.nav.trends', path: '/trends', short: 'TR' },
]

export const ADMIN_NAV_ITEMS: PrimaryNavItem[] = [
  { labelKey: 'admin.nav.processes', path: '/admin/processes', short: 'AP' },
  { labelKey: 'admin.nav.imports', path: '/admin/imports', short: 'AI' },
  { labelKey: 'admin.nav.areas', path: '/admin/areas', short: 'AA' },
  { labelKey: 'admin.nav.faculties', path: '/admin/faculties', short: 'AF' },
  { labelKey: 'admin.nav.majors', path: '/admin/majors', short: 'AM' },
]
