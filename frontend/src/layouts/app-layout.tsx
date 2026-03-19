import { Outlet } from 'react-router-dom'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8" aria-label="Main content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
