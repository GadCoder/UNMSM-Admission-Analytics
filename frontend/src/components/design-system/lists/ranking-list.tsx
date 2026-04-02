type RankingItem = {
  id: string
  label: string
  value: string
  description?: string
  progress?: number
}

export function RankingList({ items }: { items: RankingItem[] }) {
  return (
    <ol className="space-y-2 rounded-card border border-primary/10 bg-surface p-4 shadow-soft">
      {items.map((item, index) => (
        <li key={item.id} className="rounded-card border border-primary/10 bg-background px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-textPrimary">
              {index + 1}. {item.label}
            </p>
            <span className="shrink-0 whitespace-nowrap text-right text-sm font-semibold text-primaryDark">{item.value}</span>
          </div>
          {item.description ? <p className="mt-1 text-xs text-textSecondary">{item.description}</p> : null}
          {typeof item.progress === 'number' ? (
            <div className="mt-2 h-2 rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
