type FilterPillProps = {
  label: string
  value: string
}

export function FilterPill({ label, value }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-surface px-2.5 py-1 text-xs text-textSecondary shadow-soft">
      <strong className="font-semibold text-primaryDark">{label}:</strong>
      {value}
    </span>
  )
}
