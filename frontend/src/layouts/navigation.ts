export type PrimaryNavItem = {
  labelKey: string
  path: string
  short: string
}

export type ResolvedPrimaryNavItem = {
  label: string
  path: string
  short: string
}

export type PrimaryNavGroup = {
  label: string
  items: ResolvedPrimaryNavItem[]
}

type TranslateFn = (key: string) => string

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

export function buildPrimaryNavItems(t: TranslateFn): ResolvedPrimaryNavItem[] {
  return PRIMARY_NAV_ITEMS.map((item) => ({
    label: t(item.labelKey),
    path: item.path,
    short: item.short,
  }))
}

export function buildPrimaryNavGroups(t: TranslateFn): PrimaryNavGroup[] {
  const items = buildPrimaryNavItems(t)

  return [
    {
      label: t('shell.group.coreViews'),
      items: items.slice(0, 3),
    },
    {
      label: t('shell.group.analyticsViews'),
      items: items.slice(3),
    },
  ]
}
