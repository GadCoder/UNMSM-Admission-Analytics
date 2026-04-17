import { Outlet } from 'react-router-dom'

import { Container } from '../components/design-system'
import { Sidebar } from './sidebar'

export function AppLayout() {
  return (
    <div className="h-screen overflow-hidden bg-background text-textPrimary">
      <Container className="flex h-full !px-0">
        <Sidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8 md:py-8" aria-label="Main content">
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  )
}
