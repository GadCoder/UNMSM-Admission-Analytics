import { Button } from '../primitives/button'

type ChipTagProps = {
  label: string
  onRemove?: () => void
}

export function ChipTag({ label, onRemove }: ChipTagProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primaryDark">
      {label}
      {onRemove ? (
        <Button aria-label={`Remove ${label}`} className="h-5 px-1.5 py-0 text-xs" variant="ghost" onClick={onRemove}>
          ×
        </Button>
      ) : null}
    </span>
  )
}
