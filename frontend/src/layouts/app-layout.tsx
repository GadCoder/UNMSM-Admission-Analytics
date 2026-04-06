import { Outlet } from 'react-router-dom'

import { Container } from '../components/design-system'
import { useI18n } from '../lib/i18n'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppLayout() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Container className="flex min-h-screen !px-0">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8" aria-label={t('shell.mainContentAriaLabel')}>
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  )
}
