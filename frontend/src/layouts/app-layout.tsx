import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Container } from '../components/design-system'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppLayout() {
  const { t } = useTranslation(['shell'])

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Container className="flex min-h-screen !px-0">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8" aria-label={t('shell:topbar.mainContentLabel')}>
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  )
}
