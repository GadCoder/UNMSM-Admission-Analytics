type ShellPlaceholderPageProps = {
  title: string
  description: string
}

export function ShellPlaceholderPage({ title, description }: ShellPlaceholderPageProps) {
  return (
    <section className="rounded-card border border-primary/10 bg-surface p-6 shadow-soft md:p-8">
      <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primaryDark">
        App Shell Placeholder
      </p>
      <h2 className="mt-4 text-2xl font-semibold text-textPrimary md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-textSecondary md:text-base">{description}</p>
    </section>
  )
}
