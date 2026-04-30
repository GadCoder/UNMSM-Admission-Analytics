import { Sidebar as DesignSystemSidebar, type SidebarNavGroup } from '../components/design-system'
import { useTranslation } from 'react-i18next'

import { PRIMARY_NAV_ITEMS } from './navigation'

export function Sidebar() {
  const { t } = useTranslation(['shell'])
  const navGroups: SidebarNavGroup[] = [
    {
      label: t('shell:groups.coreViews'),
      items: PRIMARY_NAV_ITEMS.slice(0, 3).map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    },
    {
      label: t('shell:groups.analyticsViews'),
      items: PRIMARY_NAV_ITEMS.slice(3).map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    },
  ]

  return <DesignSystemSidebar title={t('shell:title')} subtitle={t('shell:subtitle')} groups={navGroups} />
}
