import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminRouteGuard } from '../features/admin-auth/components/admin-route-guard'
import { AdminAreasPage } from '../pages/admin-areas-page'
import { AdminFacultiesPage } from '../pages/admin-faculties-page'
import { AdminImportsPage } from '../pages/admin-imports-page'
import { AdminLoginPage } from '../pages/admin-login-page'
import { AdminMajorsPage } from '../pages/admin-majors-page'
import { AdminProcessesPage } from '../pages/admin-processes-page'
import { AdminShell } from '../pages/admin-shell'
import { AppLayout } from '../layouts/app-layout'
import { ComparePage } from '../pages/compare-page'
import { DashboardPage } from '../pages/dashboard-page'
import { ExplorePage } from '../pages/explore-page'
import { RankingsPage } from '../pages/rankings-page'
import { ResultsPage } from '../pages/results-page'
import { ShowcasePage } from '../pages/showcase-page'
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
        <Route path="/showcase" element={<ShowcasePage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<AdminRouteGuard />}>
        <Route element={<AppLayout />}>
          <Route element={<AdminShell />}>
            <Route path="/admin/areas" element={<AdminAreasPage />} />
            <Route path="/admin/faculties" element={<AdminFacultiesPage />} />
            <Route path="/admin/majors" element={<AdminMajorsPage />} />
            <Route path="/admin/processes" element={<AdminProcessesPage />} />
            <Route path="/admin/imports" element={<AdminImportsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
