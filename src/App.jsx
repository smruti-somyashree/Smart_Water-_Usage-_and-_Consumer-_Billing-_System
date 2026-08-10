import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import AboutPage from './pages/AboutPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import SignupPage from './pages/SignupPage'
import WelcomePage from './pages/WelcomePage'

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
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<WelcomePage title="Welcome, resident" />} />
      <Route path="/admin" element={<WelcomePage title="Welcome, administrator" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
