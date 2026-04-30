import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../components/design-system'
import {
  cancelBatchItems,
  createResultsBatch,
  getBatchStatus,
  listBatchItems,
  retryBatchItems,
  type BatchItem,
  type BatchStatus,
} from '../features/admin/api/admin-api'
import { getApiErrorMessage } from '../features/admin/model/error-message'
import { nextPollInterval, buildProcessOverrides } from '../features/admin-imports/model/polling'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { useI18n } from '../lib/i18n'

const MAX_FILES_PER_BATCH = 100
const MAX_FILE_MB = 25

export function AdminImportsPage() {
  const { t } = useI18n()
  const { options: processOptions } = useProcessOptions()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [defaultProcessId, setDefaultProcessId] = useState('')
  const [overrideByName, setOverrideByName] = useState<Record<string, number>>({})
  const [batchId, setBatchId] = useState<number | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pollMs, setPollMs] = useState(2_000)
  const [isDragging, setIsDragging] = useState(false)
  const lastSignatureRef = useRef<string | null>(null)

  const inProgress = useMemo(() => {
    if (!batchStatus) {
      return false
    }
    return batchStatus.queued_items > 0 || batchStatus.processing_items > 0
  }, [batchStatus])

  const validateFiles = (files: File[]) => {
    if (files.length === 0) {
      setErrorMessage(t('admin.imports.error.selectCsv'))
      return false
    }
    if (files.length > MAX_FILES_PER_BATCH) {
      setErrorMessage(t('admin.imports.error.maxFiles').replace('{max}', String(MAX_FILES_PER_BATCH)))
      return false
    }

    for (const file of files) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setErrorMessage(
          t('admin.imports.error.maxFileSize').replace('{file}', file.name).replace('{max}', String(MAX_FILE_MB)),
        )
        return false
      }
    }
    return true
  }

  const onPickFiles = (files: FileList | null) => {
    if (!files) {
      return
    }
    const nextFiles = Array.from(files)
    if (!validateFiles(nextFiles)) {
      return
    }
    setErrorMessage(null)
    setSelectedFiles(nextFiles)
  }

  const submitBatch = async () => {
    const parsedDefaultProcessId = Number(defaultProcessId)
    if (!Number.isInteger(parsedDefaultProcessId) || parsedDefaultProcessId <= 0) {
      setErrorMessage(t('admin.imports.error.defaultProcessRequired'))
      return
    }
    if (!validateFiles(selectedFiles)) {
      return
    }

    try {
      setErrorMessage(null)
      const response = await createResultsBatch({
        files: selectedFiles,
        defaultProcessId: parsedDefaultProcessId,
        processOverrides: buildProcessOverrides(
          selectedFiles.map((file) => file.name),
          parsedDefaultProcessId,
          overrideByName
        ),
      })
      setBatchId(response.batch_id)
      setPollMs(2_000)
      lastSignatureRef.current = null
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('admin.imports.error.submit')))
    }
  }

  useEffect(() => {
    if (!batchId) {
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      if (!active) {
        return
      }
      try {
        const [status, items] = await Promise.all([getBatchStatus(batchId), listBatchItems(batchId)])
        if (!active) {
          return
        }
        setBatchStatus(status)
        setBatchItems(items)

        const signature = `${status.queued_items}|${status.processing_items}|${status.completed_items}|${status.failed_items}|${status.cancelled_items}`
        const hasChanged = lastSignatureRef.current !== signature
        lastSignatureRef.current = signature
        setPollMs((previous) => nextPollInterval(previous, hasChanged))
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, t('admin.imports.error.refresh')))
      }
    }, pollMs)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [batchId, pollMs])

  const updateOverride = (fileName: string, processId: string) => {
    const parsed = Number(processId)
    setOverrideByName((previous) => {
      if (!Number.isInteger(parsed) || parsed <= 0) {
        const next = { ...previous }
        delete next[fileName]
        return next
      }
      return {
        ...previous,
        [fileName]: parsed,
      }
    })
  }

  return (
    <section className="space-y-4 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-textPrimary">{t('admin.imports.title')}</h2>

      <div
        className={`rounded-card border-2 border-dashed p-6 text-center ${isDragging ? 'border-primary bg-primary/5' : 'border-primary/25'}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          onPickFiles(event.dataTransfer.files)
        }}
      >
        <p className="text-sm text-textSecondary">{t('admin.imports.dropzone')}</p>
        <input className="mt-3" type="file" accept=".csv,text/csv" multiple onChange={(event) => onPickFiles(event.target.files)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-textSecondary">
          {t('admin.imports.defaultProcess')}
          <select
            className="mt-1 w-full rounded-card border border-primary/20 bg-white px-3 py-2 text-sm"
            value={defaultProcessId}
            onChange={(event) => setDefaultProcessId(event.target.value)}
          >
            <option value="">{t('admin.imports.selectProcess')}</option>
            {processOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <Button type="button" variant="primary" onClick={submitBatch} disabled={selectedFiles.length === 0}>
            {t('admin.imports.createBatch')}
          </Button>
        </div>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-primary/15 text-left text-textSecondary">
                <th className="py-2 pr-3">{t('admin.imports.file')}</th>
                <th className="py-2 pr-3">{t('admin.imports.size')}</th>
                <th className="py-2">{t('admin.imports.processOverride')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedFiles.map((file) => (
                <tr key={file.name} className="border-b border-primary/10">
                  <td className="py-2 pr-3">{file.name}</td>
                  <td className="py-2 pr-3">{(file.size / (1024 * 1024)).toFixed(2)} MB</td>
                  <td className="py-2">
                    <select
                      className="rounded-card border border-primary/20 bg-white px-2 py-1 text-sm"
                      value={String(overrideByName[file.name] ?? '')}
                      onChange={(event) => updateOverride(file.name, event.target.value)}
                    >
                      <option value="">{t('admin.imports.useDefault')}</option>
                      {processOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      {batchId ? (
        <div className="space-y-3 rounded-card border border-primary/15 bg-white/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-textPrimary">{t('admin.imports.batchLabel').replace('{id}', String(batchId))}</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => retryBatchItems(batchId)}>
                {t('admin.imports.retryFailed')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => cancelBatchItems(batchId)} disabled={!inProgress}>
                {t('admin.imports.cancelQueued')}
              </Button>
            </div>
          </div>

          {batchStatus ? (
            <p className="text-sm text-textSecondary">
              {t('admin.imports.statusSummary')
                .replace('{queued}', String(batchStatus.queued_items))
                .replace('{processing}', String(batchStatus.processing_items))
                .replace('{completed}', String(batchStatus.completed_items))
                .replace('{failed}', String(batchStatus.failed_items))
                .replace('{cancelled}', String(batchStatus.cancelled_items))}
            </p>
          ) : (
            <p className="text-sm text-textSecondary">{t('admin.imports.loadingBatchStatus')}</p>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-primary/15 text-left text-textSecondary">
                   <th className="py-2 pr-3">{t('admin.imports.file')}</th>
                   <th className="py-2 pr-3">{t('admin.imports.column.status')}</th>
                   <th className="py-2 pr-3">{t('admin.imports.column.importedTotal')}</th>
                   <th className="py-2">{t('admin.imports.column.error')}</th>
                </tr>
              </thead>
              <tbody>
                {batchItems.map((item) => (
                  <tr key={item.item_id} className="border-b border-primary/10">
                    <td className="py-2 pr-3">{item.filename}</td>
                    <td className="py-2 pr-3">{item.status}</td>
                    <td className="py-2 pr-3">
                      {item.imported_rows}/{item.total_rows}
                    </td>
                    <td className="py-2">{item.failure_reason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}
