import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import type { PropsWithChildren } from 'react'
import { AdminAuthProvider } from '../features/admin-auth/model/admin-auth-context'

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
      <AdminAuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AdminAuthProvider>
    </QueryClientProvider>
  )
}
