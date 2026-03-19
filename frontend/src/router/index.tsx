import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../layouts/app-layout'
import { ComparePage } from '../pages/compare-page'
import { DashboardPage } from '../pages/dashboard-page'
import { ExplorePage } from '../pages/explore-page'
import { RankingsPage } from '../pages/rankings-page'
import { ResultsPage } from '../pages/results-page'
import { TrendsPage } from '../pages/trends-page'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/trends" element={<TrendsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
