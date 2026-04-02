import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '../foundation/cn'
import { ChipTag } from './chip-tag'
import { debounce, getVisibleRange } from './multi-select-search-utils'
import type { SelectOption } from './types'

type MultiSelectSearchProps = {
  label?: string
  selected: SelectOption[]
  onChange: (nextSelected: SelectOption[]) => void
  loadOptions: (query: string) => Promise<SelectOption[]>
  maxSelection?: number
  statusMessage?: string | null
  compact?: boolean
  debounceMs?: number
}

const ITEM_HEIGHT = 36
const VIEWPORT_HEIGHT = 144

export function MultiSelectSearch({
  label = 'Compare Majors',
  selected,
  onChange,
  loadOptions,
  maxSelection,
  statusMessage,
  compact = false,
  debounceMs = 250,
}: MultiSelectSearchProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SelectOption[]>([])
  const [scrollTop, setScrollTop] = useState(0)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const requestVersionRef = useRef(0)

  const runSearch = useMemo(
    () =>
      debounce(async (nextQuery: string) => {
        requestVersionRef.current += 1
        const currentVersion = requestVersionRef.current

        setIsLoading(true)
        try {
          const loaded = await loadOptions(nextQuery)
          if (currentVersion === requestVersionRef.current) {
            setResults(loaded)
          }
        } finally {
          if (currentVersion === requestVersionRef.current) {
            setIsLoading(false)
          }
        }
      }, debounceMs),
    [debounceMs, loadOptions]
  )

  useEffect(() => {
    requestVersionRef.current += 1
    const currentVersion = requestVersionRef.current
    let cancelled = false

    setIsLoading(true)
    loadOptions(query)
      .then((loaded) => {
        if (!cancelled && currentVersion === requestVersionRef.current) {
          setResults(loaded)
        }
      })
      .finally(() => {
        if (!cancelled && currentVersion === requestVersionRef.current) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadOptions, query])

  const { start, end } = getVisibleRange({
    scrollTop,
    itemHeight: ITEM_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
    total: results.length,
    overscan: 4,
  })

  const visibleResults = results.slice(start, end)

  const toggleSelection = (option: SelectOption) => {
    const exists = selected.some((item) => item.value === option.value)
    if (exists) {
      onChange(selected.filter((item) => item.value !== option.value))
      return
    }
    onChange([...selected, option])
    setQuery('')
    runSearch('')
    setIsSuggestionsOpen(false)
  }

  const showSuggestions = isSuggestionsOpen || query.trim().length > 0

  return (
    <section className={compact ? 'rounded-card border border-primary/15 bg-surface p-3 shadow-soft' : 'rounded-card border border-primary/15 bg-surface p-4 shadow-soft'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">{label}</p>
        {maxSelection ? (
          <p className="text-xs font-medium text-textSecondary">
            {selected.length}/{maxSelection} selected
          </p>
        ) : null}
      </div>

      <p className={cn('text-xs text-textSecondary', compact ? 'mt-0.5' : 'mt-1')}>
        {maxSelection ? `Select up to ${maxSelection} majors to compare.` : 'Select majors to compare.'}
      </p>

      <input
        type="search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value
          setQuery(nextQuery)
          runSearch(nextQuery)
        }}
        onFocus={() => setIsSuggestionsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsSuggestionsOpen(false), 120)
        }}
        placeholder="Search majors..."
        className={cn(
          'w-full rounded-card border border-primary/20 bg-background px-3 py-2 text-sm text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          compact ? 'mt-2' : 'mt-3'
        )}
      />

      <div className={cn('rounded-card border border-primary/10 bg-background/70 p-2', compact ? 'mt-2' : 'mt-3')}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primaryDark">Selected</p>
          {selected.length > 0 ? <p className="text-xs text-textSecondary">Scroll to view all</p> : null}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {selected.length > 0 ? (
            selected.map((option) => (
              <div key={option.value} className="shrink-0">
                <ChipTag
                  label={option.label}
                  onRemove={() => onChange(selected.filter((item) => item.value !== option.value))}
                />
              </div>
            ))
          ) : (
            <p className="text-xs text-textSecondary">No majors selected yet.</p>
          )}
        </div>
      </div>

      {showSuggestions ? (
        <>
          <p className={cn('text-xs font-semibold uppercase tracking-[0.12em] text-primaryDark', compact ? 'mt-2' : 'mt-3')}>Suggestions</p>

          <div
            className="mt-2 overflow-auto rounded-card border border-primary/10 bg-background"
            style={{ height: VIEWPORT_HEIGHT }}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            <div style={{ height: results.length * ITEM_HEIGHT, position: 'relative' }}>
              {visibleResults.map((option, index) => {
                const rowIndex = start + index
                const top = rowIndex * ITEM_HEIGHT
                const isSelected = selected.some((item) => item.value === option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    style={{ top, height: ITEM_HEIGHT }}
                    className={cn(
                      'absolute left-0 right-0 flex items-center justify-between px-3 text-left text-sm transition',
                      isSelected ? 'bg-primary/12 text-primaryDark' : 'hover:bg-primary/5 text-textSecondary'
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleSelection(option)}
                  >
                    <span className={cn('truncate pr-3', isSelected ? 'font-semibold' : '')}>{option.label}</span>
                    <span
                      className={cn(
                        'inline-flex min-w-14 items-center justify-center rounded-card border px-2 py-0.5 text-xs font-semibold',
                        isSelected
                          ? 'border-primary/35 bg-primary/12 text-primaryDark'
                          : 'border-primary/25 bg-white text-textSecondary'
                      )}
                    >
                      {isSelected ? '✓ Selected' : 'Add'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : null}

      {showSuggestions && !isLoading && results.length === 0 ? <p className="mt-2 text-xs text-textSecondary">No majors found.</p> : null}

      {isLoading ? <p className="mt-2 text-xs text-textSecondary">Loading search results...</p> : null}

      {statusMessage ? <p className="mt-2 text-xs text-danger">{statusMessage}</p> : null}
    </section>
  )
}
