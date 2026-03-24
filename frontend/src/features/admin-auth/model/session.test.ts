import { describe, expect, it } from 'vitest'

import { buildAdminLoginRedirect, clearAdminToken, loadAdminToken, saveAdminToken } from './session'

function createStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('admin session helpers', () => {
  it('persists and restores token from storage', () => {
    const storage = createStorageMock()
    saveAdminToken('abc-token', storage)
    expect(loadAdminToken(storage)).toBe('abc-token')
    clearAdminToken(storage)
    expect(loadAdminToken(storage)).toBeNull()
  })

  it('builds redirect path to preserve protected route', () => {
    expect(buildAdminLoginRedirect('/admin/imports')).toBe('/admin/login?next=%2Fadmin%2Fimports')
  })
})
