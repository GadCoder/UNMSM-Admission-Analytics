import { Button } from '../primitives/button'

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const canPrevious = page > 1
  const canNext = page < totalPages

  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <Button disabled={!canPrevious} onClick={() => canPrevious && onPageChange(page - 1)} variant="secondary">
        Previous
      </Button>
      <p className="text-sm text-textSecondary">
        Page {page} of {totalPages}
      </p>
      <Button disabled={!canNext} onClick={() => canNext && onPageChange(page + 1)} variant="secondary">
        Next
      </Button>
    </nav>
  )
}
