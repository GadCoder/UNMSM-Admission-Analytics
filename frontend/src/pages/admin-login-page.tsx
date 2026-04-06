import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '../components/design-system'
import { AdminLoginError } from '../features/admin-auth/model/admin-login-error'
import { useAdminAuth } from '../features/admin-auth/model/use-admin-auth'
import { useI18n } from '../lib/i18n'

function resolveNextPath(search: string): string {
  const params = new URLSearchParams(search)
  const nextPath = params.get('next')
  if (!nextPath || !nextPath.startsWith('/admin/')) {
    return '/admin/processes'
  }
  return nextPath
}

export function AdminLoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAdminAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await login(username, password)
      navigate(resolveNextPath(location.search), { replace: true })
    } catch (error) {
      if (error instanceof AdminLoginError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage(t('admin.login.authError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto mt-12 max-w-md rounded-card border border-primary/20 bg-surface p-6 shadow-soft md:mt-20 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primaryDark">{t('admin.login.badge')}</p>
      <h1 className="mt-3 text-2xl font-semibold text-textPrimary">{t('admin.login.title')}</h1>
      <p className="mt-1 text-sm text-textSecondary">{t('admin.login.subtitle')}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm text-textSecondary">
          {t('admin.login.username')}
          <input
            className="mt-1 w-full rounded-card border border-primary/20 bg-white px-3 py-2 text-sm text-textPrimary"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="block text-sm text-textSecondary">
          {t('admin.login.password')}
          <input
            type="password"
            className="mt-1 w-full rounded-card border border-primary/20 bg-white px-3 py-2 text-sm text-textPrimary"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

        <Button variant="primary" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t('admin.login.signingIn') : t('admin.login.signIn')}
        </Button>
      </form>
    </section>
  )
}
