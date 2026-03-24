const ADMIN_SESSION_KEY = 'unmsm.admin.access-token'

export function loadAdminToken(storage: Pick<Storage, 'getItem'> = window.localStorage): string | null {
  const rawValue = storage.getItem(ADMIN_SESSION_KEY)
  if (!rawValue) {
    return null
  }
  const trimmedValue = rawValue.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

export function saveAdminToken(token: string, storage: Pick<Storage, 'setItem'> = window.localStorage) {
  storage.setItem(ADMIN_SESSION_KEY, token)
}

export function clearAdminToken(storage: Pick<Storage, 'removeItem'> = window.localStorage) {
  storage.removeItem(ADMIN_SESSION_KEY)
}

export function buildAdminLoginRedirect(pathname: string) {
  return `/admin/login?next=${encodeURIComponent(pathname)}`
}
