import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import axios from 'axios'

import { httpClient, setAdminAccessToken } from '../../../lib/api'
import { AdminLoginError } from './admin-login-error'
import { AdminAuthContext, type AdminAuthContextValue } from './admin-auth-store'
import { clearAdminToken, loadAdminToken, saveAdminToken } from './session'

type AdminLoginResponse = {
  access_token: string
}

function normalizeLoginError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim() !== '') {
      return detail
    }
  }
  return 'Could not authenticate admin session.'
}

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => loadAdminToken())

  useEffect(() => {
    setAdminAccessToken(token)
  }, [token])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      token,
      isAuthenticated: token !== null,
      login: async (username: string, password: string) => {
        try {
          const response = await httpClient.post<AdminLoginResponse>('/auth/admin/login', {
            username,
            password,
          })
          const accessToken = response.data.access_token
          saveAdminToken(accessToken)
          setToken(accessToken)
        } catch (error) {
          throw new AdminLoginError(normalizeLoginError(error))
        }
      },
      logout: () => {
        clearAdminToken()
        setToken(null)
      },
    }),
    [token]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
