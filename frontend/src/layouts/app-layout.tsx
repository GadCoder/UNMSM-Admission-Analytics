import { Outlet } from 'react-router-dom'

import { Container } from '../components/design-system'
import { Sidebar } from './sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Container className="flex min-h-screen !px-0">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8" aria-label="Main content">
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  )
}
