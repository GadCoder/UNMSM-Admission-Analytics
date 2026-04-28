import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../components/design-system'
import {
  createAdminProcess,
  listAdminProcesses,
  updateAdminProcess,
  type AdminProcess,
} from '../features/admin/api/admin-api'
import { getApiErrorMessage } from '../features/admin/model/error-message'

export function AdminProcessesPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [processes, setProcesses] = useState<AdminProcess[]>([])
  const [year, setYear] = useState('')
  const [cycle, setCycle] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedProcess = processes.find((item) => item.id === editingId) ?? null

  const refresh = async () => {
    const nextProcesses = await listAdminProcesses()
    setProcesses(nextProcesses)
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const nextProcesses = await listAdminProcesses()
        if (!active) {
          return
        }
        setProcesses(nextProcesses)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(getApiErrorMessage(error, t('admin:processes.errors.load')))
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

    const parsedYear = Number(year)
    if (!Number.isInteger(parsedYear) || parsedYear <= 0) {
      setErrorMessage(t('admin:processes.errors.yearRequired'))
      return
    }
    if (cycle !== 'I' && cycle !== 'II') {
      setErrorMessage(t('admin:processes.errors.cycleRequired'))
      return
    }

    try {
      const payload = {
        year: parsedYear,
        cycle,
        is_published: isPublished,
      }

      if (selectedProcess) {
        await updateAdminProcess(selectedProcess.id, {
          ...payload,
          version_token: selectedProcess.updated_at,
        })
      } else {
        await createAdminProcess(payload)
      }

      setYear('')
      setCycle('')
      setIsPublished(false)
      setEditingId(null)
      await refresh()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('admin:processes.errors.save')))
    }
  }

  const startEdit = (process: AdminProcess) => {
    setEditingId(process.id)
    setYear(String(process.year))
    setCycle(process.cycle)
    setIsPublished(process.is_published)
  }

  const generatedLabel = year && cycle ? `${year}-${cycle}` : ''

  return (
    <section className="space-y-4 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-textPrimary">{t('admin:processes.title')}</h2>

      <form className="grid gap-3 md:grid-cols-5" onSubmit={onSubmit}>
        <input
          className="rounded-card border border-primary/20 px-3 py-2 text-sm"
          placeholder={t('admin:processes.placeholders.year')}
          type="number"
          min={2000}
          value={year}
          onChange={(event) => setYear(event.target.value)}
          required
        />
        <select
          className="rounded-card border border-primary/20 bg-white px-3 py-2 text-sm"
          value={cycle}
          onChange={(event) => setCycle(event.target.value)}
          required
        >
          <option value="">{t('admin:processes.placeholders.selectCycle')}</option>
          <option value="I">I</option>
          <option value="II">II</option>
        </select>
        <div className="rounded-card border border-primary/20 bg-white px-3 py-2 text-sm text-textSecondary">
          {t('admin:processes.form.label')}: <span className="font-semibold text-textPrimary">{generatedLabel || '-'}</span>
        </div>
        <label className="flex items-center gap-2 rounded-card border border-primary/20 px-3 py-2 text-sm text-textSecondary">
          <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
          {t('admin:processes.form.published')}
        </label>
        <div className="flex gap-2">
          <Button variant="primary" type="submit">
            {selectedProcess ? t('admin:processes.form.update') : t('admin:processes.form.create')}
          </Button>
          {selectedProcess ? (
            <Button
              type="button"
              onClick={() => {
                setEditingId(null)
                setYear('')
                setCycle('')
                setIsPublished(false)
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
              <th className="py-2 pr-3">{t('admin:processes.table.label')}</th>
              <th className="py-2 pr-3">{t('admin:processes.table.year')}</th>
              <th className="py-2 pr-3">{t('admin:processes.table.cycle')}</th>
              <th className="py-2 pr-3">{t('admin:processes.table.published')}</th>
              <th className="py-2">{t('common:table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.id} className="border-b border-primary/10">
                <td className="py-2 pr-3">{process.id}</td>
                <td className="py-2 pr-3">{process.label}</td>
                <td className="py-2 pr-3">{process.year}</td>
                <td className="py-2 pr-3">{process.cycle}</td>
                 <td className="py-2 pr-3">{process.is_published ? t('common:states.yes') : t('common:states.no')}</td>
                <td className="py-2">
                  <Button type="button" variant="ghost" onClick={() => startEdit(process)}>
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
