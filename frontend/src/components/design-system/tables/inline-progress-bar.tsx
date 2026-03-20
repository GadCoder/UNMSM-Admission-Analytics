export function InlineProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-primary/10">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
