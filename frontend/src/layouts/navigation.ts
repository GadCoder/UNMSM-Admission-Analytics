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
