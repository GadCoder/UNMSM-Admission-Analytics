import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAdminAuth } from '../model/use-admin-auth'
import { buildAdminLoginRedirect } from '../model/session'

export function AdminRouteGuard() {
  const location = useLocation()
  const { isAuthenticated } = useAdminAuth()

  if (!isAuthenticated) {
    return <Navigate to={buildAdminLoginRedirect(location.pathname)} replace />
  }

  return <Outlet />
}
