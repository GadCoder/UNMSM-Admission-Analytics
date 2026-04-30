import { Sidebar as DesignSystemSidebar, type SidebarNavGroup } from '../components/design-system'
import { useI18n } from '../lib/i18n'
import { buildPrimaryNavGroups } from './navigation'

export function Sidebar() {
  const { t } = useI18n()

  const navGroups: SidebarNavGroup[] = buildPrimaryNavGroups(t)

  return (
    <DesignSystemSidebar
      title={t('shell.brandTitle')}
      subtitle={t('shell.brandSubtitle')}
      groups={navGroups}
      navAriaLabel={t('shell.primaryNavigationAriaLabel')}
    />
  )
}
