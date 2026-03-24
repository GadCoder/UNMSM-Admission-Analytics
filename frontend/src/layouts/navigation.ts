export type PrimaryNavItem = {
  label: string
  path: string
  short: string
}

export const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  { label: 'Dashboard', path: '/dashboard', short: 'DB' },
  { label: 'Explore', path: '/explore', short: 'EX' },
  { label: 'Compare', path: '/compare', short: 'CP' },
  { label: 'Rankings', path: '/rankings', short: 'RK' },
  { label: 'Results', path: '/results', short: 'RS' },
  { label: 'Trends', path: '/trends', short: 'TR' },
]

export const ADMIN_NAV_ITEMS: PrimaryNavItem[] = [
  { label: 'Admin Processes', path: '/admin/processes', short: 'AP' },
  { label: 'Admin Imports', path: '/admin/imports', short: 'AI' },
  { label: 'Admin Areas', path: '/admin/areas', short: 'AA' },
  { label: 'Admin Faculties', path: '/admin/faculties', short: 'AF' },
  { label: 'Admin Majors', path: '/admin/majors', short: 'AM' },
]
