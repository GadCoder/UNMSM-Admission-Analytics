import { useEffect, useMemo, useState } from 'react'

import {
  DataTable,
  Pagination,
  SectionHeader,
  Select,
  Skeleton,
  TableToolbar,
  type DataColumn,
} from '../components/design-system'
import { useAcademicAreaOptions } from '../features/global-filters/api/use-academic-area-options'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { GlobalFilterBar, useGlobalFilters } from '../features/global-filters'
import { useResultsMajorOptions } from '../features/results/api/use-results-major-options'
import { useResultsQuery } from '../features/results/api/use-results-data'
import { mapResultItemsToRows, type ResultsTableRow } from '../features/results/model/results-adapter'
import { deriveResultsPageState } from '../features/results/model/results-page-state'
import { resolveResultsProcessId, toOptionalInt } from '../features/results/model/results-scope'
import { useI18n } from '../lib/i18n'

export function ResultsPage() {
  const { t } = useI18n()
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()
  const processOptionsQuery = useProcessOptions()
  const academicAreaOptionsQuery = useAcademicAreaOptions()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [majorId, setMajorId] = useState('')
  const [page, setPage] = useState(1)

  const processIdFromFilters = toOptionalInt(filters.processId)
  const academicAreaId = toOptionalInt(filters.academicAreaId)
  const selectedMajorId = toOptionalInt(majorId)
  const effectiveProcessId = resolveResultsProcessId(processIdFromFilters, processOptionsQuery.options)
  const majorOptionsQuery = useResultsMajorOptions(academicAreaId)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.processId, filters.academicAreaId, majorId])

  useEffect(() => {
    if (!majorId) {
      return
    }

    const exists = majorOptionsQuery.options.some((option) => option.value === majorId)
    if (!exists) {
      setMajorId('')
    }
  }, [majorId, majorOptionsQuery.options])

  const resultsQuery = useResultsQuery({
    processId: effectiveProcessId,
    academicAreaId,
    majorId: selectedMajorId,
    candidateName: debouncedSearch,
    page,
  })

  const rows = useMemo(() => mapResultItemsToRows(resultsQuery.data?.items ?? []), [resultsQuery.data?.items])

  const pageError =
    processOptionsQuery.errorMessage ??
    academicAreaOptionsQuery.errorMessage ??
    majorOptionsQuery.errorMessage ??
    resultsQuery.errorMessage
  const isLoading =
    processOptionsQuery.isLoading || academicAreaOptionsQuery.isLoading || majorOptionsQuery.isLoading || resultsQuery.isLoading
  const pageState = deriveResultsPageState({
    isLoading,
    errorMessage: pageError,
    rowCount: rows.length,
  })

  const columns: DataColumn<ResultsTableRow>[] = [
    {
      key: 'candidateCode',
      header: t('results.column.code'),
      render: (row) => row.candidateCode,
    },
    {
      key: 'applicant',
      header: t('results.column.applicant'),
      render: (row) => <span className="block max-w-64 truncate">{row.applicant}</span>,
    },
    {
      key: 'major',
      header: t('results.column.major'),
      render: (row) => <span className="block max-w-56 truncate">{row.major}</span>,
    },
    {
      key: 'score',
      header: t('results.column.score'),
      align: 'right',
      render: (row) => row.score.toFixed(1),
    },
    {
      key: 'status',
      header: t('results.column.status'),
      render: (row) => row.status,
    },
  ]

  const totalPages = resultsQuery.data?.total_pages ?? 1

  return (
    <div className="space-y-5">
      <SectionHeader title={t('results.title')} subtitle={t('results.subtitle')} />

      <GlobalFilterBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        setProcessId={setProcessId}
        setAcademicAreaId={setAcademicAreaId}
        resetFilters={resetFilters}
      />

      {processIdFromFilters === null ? (
        <p className="text-sm text-textSecondary">{t('results.noProcessSelected')}</p>
      ) : null}

      <section className="rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          actions={
            <div className="w-64 shrink-0">
              <Select
                label={t('results.major')}
                value={majorId}
                options={majorOptionsQuery.options}
                placeholder={majorOptionsQuery.isLoading ? t('results.loadingMajors') : t('results.allMajors')}
                onChange={(event) => setMajorId(event.target.value)}
                disabled={majorOptionsQuery.isLoading || majorOptionsQuery.options.length === 0}
              />
            </div>
          }
        />

        {pageState === 'loading' ? (
          <div className="space-y-2 rounded-card border border-primary/10 bg-surface p-3 shadow-soft">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : null}

        {pageState === 'error' ? <p className="text-sm text-danger">{pageError}</p> : null}
        {pageState === 'empty' ? <p className="text-sm text-textSecondary">{t('results.empty')}</p> : null}

        {pageState === 'ready' ? <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} /> : null}

        {pageState === 'ready' ? (
          <div className="mt-3">
            <Pagination page={resultsQuery.data?.page ?? page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </section>
    </div>
  )
}
