import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../components/design-system'
import { createAdminArea, listAdminAreas, updateAdminArea, type AdminArea } from '../features/admin/api/admin-api'
import { getApiErrorMessage } from '../features/admin/model/error-message'

export function AdminAreasPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [areas, setAreas] = useState<AdminArea[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedArea = areas.find((area) => area.id === editingId) ?? null

  const refresh = async () => {
    const nextAreas = await listAdminAreas()
    setAreas(nextAreas)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const nextAreas = await listAdminAreas()
        if (!active) {
          return
        }
        setAreas(nextAreas)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(getApiErrorMessage(error, t('admin:areas.errors.load')))
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [t])

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    try {
      await createAdminArea({ name, slug })
      setName('')
      setSlug('')
      await refresh()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('admin:areas.errors.create')))
    }
  }

  const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedArea) {
      return
    }
    setErrorMessage(null)
    try {
      await updateAdminArea(selectedArea.id, {
        name,
        slug,
        version_token: selectedArea.updated_at,
      })
      setEditingId(null)
      setName('')
      setSlug('')
      await refresh()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('admin:areas.errors.update')))
    }
  }

  const startEdit = (area: AdminArea) => {
    setEditingId(area.id)
    setName(area.name)
    setSlug(area.slug)
  }

  return (
    <section className="space-y-4 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-textPrimary">{t('admin:areas.title')}</h2>

      <form className="grid gap-3 md:grid-cols-3" onSubmit={editingId ? onUpdate : onCreate}>
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:areas.placeholders.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:areas.placeholders.slug')}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
        />
        <div className="flex gap-2">
          <Button variant="primary" type="submit">
            {editingId ? t('admin:areas.form.update') : t('admin:areas.form.create')}
          </Button>
          {editingId ? (
            <Button
              type="button"
              onClick={() => {
                setEditingId(null)
                setName('')
                setSlug('')
              }}
            >
              {t('common:actions.cancel')}
            </Button>
          ) : null}
        </div>
      </form>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-primary/15 text-left text-textSecondary">
              <th className="py-2 pr-3">{t('common:table.id')}</th>
              <th className="py-2 pr-3">{t('common:table.name')}</th>
              <th className="py-2 pr-3">{t('common:table.slug')}</th>
              <th className="py-2">{t('common:table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} className="border-b border-primary/10">
                <td className="py-2 pr-3">{area.id}</td>
                <td className="py-2 pr-3">{area.name}</td>
                <td className="py-2 pr-3">{area.slug}</td>
                <td className="py-2">
                  <Button type="button" variant="ghost" onClick={() => startEdit(area)}>
                    {t('common:actions.edit')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
