import { Sidebar as DesignSystemSidebar, type SidebarNavGroup } from '../components/design-system'
import { useI18n } from '../lib/i18n'
import { PRIMARY_NAV_ITEMS } from './navigation'

export function Sidebar() {
  const { t } = useI18n()

  const translatedItems = PRIMARY_NAV_ITEMS.map((item) => ({
    label: t(item.labelKey),
    path: item.path,
    short: item.short,
  }))

  const navGroups: SidebarNavGroup[] = [
    {
      label: t('shell.group.coreViews'),
      items: translatedItems.slice(0, 3),
    },
    {
      label: t('shell.group.analyticsViews'),
      items: translatedItems.slice(3),
    },
  ]

  return (
    <DesignSystemSidebar
      title={t('shell.brandTitle')}
      subtitle={t('shell.brandSubtitle')}
      groups={navGroups}
      navAriaLabel={t('shell.primaryNavigationAriaLabel')}
    />
  )
}
