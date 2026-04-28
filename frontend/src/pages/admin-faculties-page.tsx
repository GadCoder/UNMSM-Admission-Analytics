import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../components/design-system'
import {
  createAdminFaculty,
  listAdminAreas,
  listAdminFaculties,
  updateAdminFaculty,
  type AdminArea,
  type AdminFaculty,
} from '../features/admin/api/admin-api'
import { getApiErrorMessage } from '../features/admin/model/error-message'

export function AdminFacultiesPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [faculties, setFaculties] = useState<AdminFaculty[]>([])
  const [areas, setAreas] = useState<AdminArea[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [academicAreaId, setAcademicAreaId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedFaculty = faculties.find((item) => item.id === editingId) ?? null

  const refresh = async () => {
    const [nextFaculties, nextAreas] = await Promise.all([listAdminFaculties(), listAdminAreas()])
    setFaculties(nextFaculties)
    setAreas(nextAreas)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [nextFaculties, nextAreas] = await Promise.all([listAdminFaculties(), listAdminAreas()])
        if (!active) {
          return
        }
        setFaculties(nextFaculties)
        setAreas(nextAreas)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(getApiErrorMessage(error, t('admin:faculties.errors.load')))
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [t])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const parsedAreaId = Number(academicAreaId)
    if (!Number.isInteger(parsedAreaId) || parsedAreaId <= 0) {
      setErrorMessage(t('admin:faculties.errors.areaRequired'))
      return
    }

    try {
      if (selectedFaculty) {
        await updateAdminFaculty(selectedFaculty.id, {
          name,
          slug,
          academic_area_id: parsedAreaId,
          version_token: selectedFaculty.updated_at,
        })
      } else {
        await createAdminFaculty({
          name,
          slug,
          academic_area_id: parsedAreaId,
        })
      }

      setName('')
      setSlug('')
      setAcademicAreaId('')
      setEditingId(null)
      await refresh()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('admin:faculties.errors.save')))
    }
  }

  const startEdit = (faculty: AdminFaculty) => {
    setEditingId(faculty.id)
    setName(faculty.name)
    setSlug(faculty.slug)
    setAcademicAreaId(String(faculty.academic_area_id))
  }

  return (
    <section className="space-y-4 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-textPrimary">{t('admin:faculties.title')}</h2>
      <form className="grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:faculties.placeholders.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:faculties.placeholders.slug')}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
        />
        <select
          className="rounded-card border border-primary/20 bg-white px-3 py-2 text-sm"
          value={academicAreaId}
          onChange={(event) => setAcademicAreaId(event.target.value)}
          required
        >
          <option value="">{t('admin:faculties.placeholders.selectArea')}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button variant="primary" type="submit">
            {selectedFaculty ? t('admin:faculties.form.update') : t('admin:faculties.form.create')}
          </Button>
          {selectedFaculty ? (
            <Button
              type="button"
              onClick={() => {
                setEditingId(null)
                setName('')
                setSlug('')
                setAcademicAreaId('')
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
              <th className="py-2 pr-3">{t('admin:faculties.table.areaId')}</th>
              <th className="py-2 pr-3">{t('common:table.slug')}</th>
              <th className="py-2">{t('common:table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {faculties.map((faculty) => (
              <tr key={faculty.id} className="border-b border-primary/10">
                <td className="py-2 pr-3">{faculty.id}</td>
                <td className="py-2 pr-3">{faculty.name}</td>
                <td className="py-2 pr-3">{faculty.academic_area_id}</td>
                <td className="py-2 pr-3">{faculty.slug}</td>
                <td className="py-2">
                  <Button type="button" variant="ghost" onClick={() => startEdit(faculty)}>
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
