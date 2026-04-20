import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import SystemPage from './pages/SystemPage'
import ResidentsBasicsPage from './pages/ResidentsBasicsPage'
import AssessmentsPage from './pages/AssessmentsPage'
import ReportPage from './pages/ReportPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="/residents" element={<ResidentsBasicsPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
