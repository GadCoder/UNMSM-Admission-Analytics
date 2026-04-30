import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../components/design-system'
import {
  createAdminMajor,
  listAdminFaculties,
  listAdminMajors,
  updateAdminMajor,
  type AdminFaculty,
  type AdminMajor,
} from '../features/admin/api/admin-api'
import { getApiErrorMessage } from '../features/admin/model/error-message'

export function AdminMajorsPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [majors, setMajors] = useState<AdminMajor[]>([])
  const [faculties, setFaculties] = useState<AdminFaculty[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedMajor = majors.find((item) => item.id === editingId) ?? null

  const refresh = async () => {
    const [nextMajors, nextFaculties] = await Promise.all([listAdminMajors(), listAdminFaculties()])
    setMajors(nextMajors)
    setFaculties(nextFaculties)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [nextMajors, nextFaculties] = await Promise.all([listAdminMajors(), listAdminFaculties()])
        if (!active) {
          return
        }
        setMajors(nextMajors)
        setFaculties(nextFaculties)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(getApiErrorMessage(error, t('admin:majors.errors.load')))
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

    const parsedFacultyId = Number(facultyId)
    if (!Number.isInteger(parsedFacultyId) || parsedFacultyId <= 0) {
      setErrorMessage(t('admin:majors.errors.facultyRequired'))
      return
    }

    try {
      if (selectedMajor) {
        await updateAdminMajor(selectedMajor.id, {
          name,
          slug,
          faculty_id: parsedFacultyId,
          is_active: isActive,
          version_token: selectedMajor.updated_at,
        })
      } else {
        await createAdminMajor({
          name,
          slug,
          faculty_id: parsedFacultyId,
          is_active: isActive,
        })
      }

      setName('')
      setSlug('')
      setFacultyId('')
      setIsActive(true)
      setEditingId(null)
      await refresh()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('admin:majors.errors.save')))
    }
  }

  const startEdit = (major: AdminMajor) => {
    setEditingId(major.id)
    setName(major.name)
    setSlug(major.slug)
    setFacultyId(String(major.faculty_id))
    setIsActive(major.is_active)
  }

  return (
    <section className="space-y-4 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-textPrimary">{t('admin:majors.title')}</h2>
      <form className="grid gap-3 md:grid-cols-5" onSubmit={onSubmit}>
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:majors.placeholders.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:majors.placeholders.slug')}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
        />
        <select
          className="rounded-card border border-primary/20 bg-white px-3 py-2 text-sm"
          value={facultyId}
          onChange={(event) => setFacultyId(event.target.value)}
          required
        >
          <option value="">{t('admin:majors.placeholders.selectFaculty')}</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-card border border-primary/20 px-3 py-2 text-sm text-textSecondary">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          {t('admin:majors.form.active')}
        </label>
        <div className="flex gap-2">
          <Button variant="primary" type="submit">
            {selectedMajor ? t('admin:majors.form.update') : t('admin:majors.form.create')}
          </Button>
          {selectedMajor ? (
            <Button
              type="button"
              onClick={() => {
                setEditingId(null)
                setName('')
                setSlug('')
                setFacultyId('')
                setIsActive(true)
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
              <th className="py-2 pr-3">{t('admin:majors.table.facultyId')}</th>
              <th className="py-2 pr-3">{t('admin:majors.table.active')}</th>
              <th className="py-2 pr-3">{t('common:table.slug')}</th>
              <th className="py-2">{t('common:table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {majors.map((major) => (
              <tr key={major.id} className="border-b border-primary/10">
                <td className="py-2 pr-3">{major.id}</td>
                <td className="py-2 pr-3">{major.name}</td>
                <td className="py-2 pr-3">{major.faculty_id}</td>
                 <td className="py-2 pr-3">{major.is_active ? t('common:states.yes') : t('common:states.no')}</td>
                <td className="py-2 pr-3">{major.slug}</td>
                <td className="py-2">
                  <Button type="button" variant="ghost" onClick={() => startEdit(major)}>
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
