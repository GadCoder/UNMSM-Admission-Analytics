type HighlightBannerProps = {
  icon?: string
  label: string
  value: string
}

export function HighlightBanner({ icon = '★', label, value }: HighlightBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-primary/20 bg-primary/10 p-3 shadow-soft">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-primaryDark">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-primaryDark">{label}</p>
        <p className="text-sm font-semibold text-textPrimary">{value}</p>
      </div>
    </div>
  )
}
