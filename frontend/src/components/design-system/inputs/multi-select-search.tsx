import { useMemo, useRef, useState } from 'react'

import { cn } from '../foundation/cn'
import { ChipTag } from './chip-tag'
import { debounce, getVisibleRange } from './multi-select-search-utils'
import type { SelectOption } from './types'

type MultiSelectSearchProps = {
  label?: string
  selected: SelectOption[]
  onChange: (nextSelected: SelectOption[]) => void
  loadOptions: (query: string) => Promise<SelectOption[]>
  debounceMs?: number
}

const ITEM_HEIGHT = 36
const VIEWPORT_HEIGHT = 180

export function MultiSelectSearch({
  label = 'Compare Entities',
  selected,
  onChange,
  loadOptions,
  debounceMs = 250,
}: MultiSelectSearchProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SelectOption[]>([])
  const [scrollTop, setScrollTop] = useState(0)
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
  }

  return (
    <section className="rounded-card border border-primary/15 bg-surface p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryDark">{label}</p>

      <input
        type="search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value
          setQuery(nextQuery)
          runSearch(nextQuery)
        }}
        placeholder="Search entities..."
        className="mt-3 w-full rounded-card border border-primary/20 bg-background px-3 py-2 text-sm text-textPrimary outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      />

      <div
        className="mt-3 overflow-auto rounded-card border border-primary/10 bg-background"
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
                  'absolute left-0 right-0 flex items-center justify-between px-3 text-left text-sm',
                  isSelected ? 'bg-primary/12 text-primaryDark' : 'hover:bg-primary/5 text-textSecondary'
                )}
                onClick={() => toggleSelection(option)}
              >
                <span>{option.label}</span>
                <span>{isSelected ? '✓' : '+'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? <p className="mt-2 text-xs text-textSecondary">Loading search results...</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {selected.map((option) => (
          <ChipTag
            key={option.value}
            label={option.label}
            onRemove={() => onChange(selected.filter((item) => item.value !== option.value))}
          />
        ))}
      </div>
    </section>
  )
}
