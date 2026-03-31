import { Sidebar as DesignSystemSidebar, type SidebarNavGroup } from '../components/design-system'
import { PRIMARY_NAV_ITEMS } from './navigation'

const navGroups: SidebarNavGroup[] = [
  {
    label: 'Core Views',
    items: PRIMARY_NAV_ITEMS.slice(0, 3),
  },
  {
    label: 'Analytics Views',
    items: PRIMARY_NAV_ITEMS.slice(3),
  },
]

export function Sidebar() {
  return <DesignSystemSidebar title="UNMSM Analytics" subtitle="Admission Explorer" groups={navGroups} />
}
