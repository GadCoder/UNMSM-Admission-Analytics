export function Topbar() {
  return (
    <header className="border-b border-primary/10 bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative w-full max-w-md">
          <span className="sr-only">Search admissions analytics</span>
          <input
            type="search"
            placeholder="Search majors, faculties, or processes"
            className="w-full rounded-card border border-primary/20 bg-background px-4 py-2 text-sm text-textPrimary placeholder:text-textSecondary/70 outline-none transition focus-visible:ring-2 focus-visible:ring-primary/60"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="rounded-card border border-primary/20 bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wider text-textSecondary">
            Global controls
          </span>
        </div>
      </div>
    </header>
  )
}
