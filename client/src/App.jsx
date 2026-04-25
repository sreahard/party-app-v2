import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import AdminLayout   from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import GuestsPage    from './pages/admin/GuestsPage'
import InvitePage    from './pages/admin/InvitePage'
import SettingsPage  from './pages/admin/SettingsPage'
import PartyPage     from './pages/party/PartyPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"       element={<Navigate to="/admin" replace />} />
          <Route path="/admin"  element={<AdminLayout />}>
            <Route index        element={<DashboardPage />} />
            <Route path="guests"  element={<GuestsPage />} />
            <Route path="invite"  element={<InvitePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/party"  element={<PartyPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
