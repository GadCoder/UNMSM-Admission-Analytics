type ProgressItem = {
  id: string
  label: string
  value: number
}

export function ProgressBarList({ items }: { items: ProgressItem[] }) {
  return (
    <ul className="space-y-2 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      {items.map((item) => (
        <li key={item.id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-textPrimary">{item.label}</span>
            <span className="font-semibold text-primaryDark">{item.value}%</span>
          </div>
          <div className="h-2 rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
