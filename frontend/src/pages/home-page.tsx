import { apiStatusApi } from '../features/system-status/api/status-api'

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
      <section className="w-full rounded-card bg-surface p-8 shadow-soft md:p-12">
        <p className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primaryDark">
          Frontend Foundation Ready
        </p>
        <h1 className="mb-4 text-3xl font-semibold text-textPrimary md:text-5xl">
          Admission Explorer
        </h1>
        <p className="max-w-2xl text-base text-textSecondary md:text-lg">
          Bootstrap completed with routing, provider composition, design-system tokenized theme, and centralized API client wiring.
        </p>
        <div className="mt-6 rounded-card border border-primary/20 bg-background p-4 text-sm text-textSecondary">
          API base URL: <code className="font-mono text-textPrimary">{apiStatusApi.baseUrl}</code>
        </div>
      </section>
    </main>
  )
}
