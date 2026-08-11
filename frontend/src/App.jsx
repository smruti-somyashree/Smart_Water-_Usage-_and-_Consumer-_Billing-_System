import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import AboutPage from './pages/AboutPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ResidentDashboardPage from './pages/ResidentDashboardPage'
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage'
import { AdminRoute, ResidentRoute, SuperAdminRoute } from './components/ProtectedRoute'

const SPLASH_VISIBLE_MS = 2600
const SPLASH_EXIT_MS = 400

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const startExit = setTimeout(() => setExiting(true), SPLASH_VISIBLE_MS)
    const remove = setTimeout(
      () => setShowSplash(false),
      SPLASH_VISIBLE_MS + SPLASH_EXIT_MS
    )
    return () => {
      clearTimeout(startExit)
      clearTimeout(remove)
    }
  }, [])

  if (showSplash) {
    return <SplashScreen exiting={exiting} />
  }

  return (
    <Routes>
      {/* Public Unauthenticated Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected Administrator Routes (ADMIN Only) */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/*" element={<AdminDashboardPage />} />
        <Route path="/billing/*" element={<AdminDashboardPage />} />
        <Route path="/tariff/*" element={<AdminDashboardPage />} />
        <Route path="/procurement/*" element={<AdminDashboardPage />} />
        <Route path="/households/*" element={<AdminDashboardPage />} />
        <Route path="/alerts/admin/*" element={<AdminDashboardPage />} />
        <Route path="/invoice/admin/*" element={<AdminDashboardPage />} />
        <Route path="/meter/admin/*" element={<AdminDashboardPage />} />
      </Route>

      <Route element={<SuperAdminRoute />}>
        <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/super-admin/*" element={<SuperAdminDashboardPage />} />
      </Route>

      {/* Protected Resident Routes (RESIDENT Only) */}
      <Route element={<ResidentRoute />}>
        <Route path="/dashboard" element={<Navigate to="/resident/dashboard" replace />} />
        <Route path="/resident/*" element={<ResidentDashboardPage />} />
        <Route path="/profile/*" element={<ResidentDashboardPage />} />
        <Route path="/my-usage/*" element={<ResidentDashboardPage />} />
        <Route path="/my-bills/*" element={<ResidentDashboardPage />} />
        <Route path="/my-invoices/*" element={<ResidentDashboardPage />} />
        <Route path="/my-alerts/*" element={<ResidentDashboardPage />} />
        <Route path="/notifications/*" element={<ResidentDashboardPage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
