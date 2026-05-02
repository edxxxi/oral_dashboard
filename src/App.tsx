import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequirePermission } from './auth'
import { AppLayout } from './layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import SystemPage from './pages/SystemPage'
import ResidentsBasicsPage from './pages/ResidentsBasicsPage'
import AssessmentsPage from './pages/AssessmentsPage'
import ReportPage from './pages/ReportPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/system"
          element={
            <RequirePermission permission="manage:staff" fallbackTo="/">
              <SystemPage />
            </RequirePermission>
          }
        />
        <Route path="/residents" element={<ResidentsBasicsPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
