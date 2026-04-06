import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import type { PropsWithChildren } from 'react'
import { AdminAuthProvider } from '../features/admin-auth/model/admin-auth-context'
import { I18nProvider } from '../lib/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AdminAuthProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </AdminAuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
