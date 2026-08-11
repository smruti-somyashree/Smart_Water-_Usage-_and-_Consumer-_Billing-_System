import { ArrowLeft, Droplets, ShieldCheck, Building2, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BuildingsSkyline from '../components/BuildingsSkyline'
import Reveal from '../components/Reveal'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

const ACCOUNT_TYPES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck },
  { value: 'COMMUNITY_ADMIN', label: 'Community Admin', icon: Building2 },
  { value: 'RESIDENT', label: 'Resident', icon: Home },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState('RESIDENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEmail('')
    setPassword('')
    const t = setTimeout(() => {
      setEmail('')
      setPassword('')
    }, 100)
    return () => clearTimeout(t)
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('User ID and password are required.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')

    setLoading(true)
    try {
      const r = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => null)
        setError(body?.message || 'Incorrect user ID or password.')
        return
      }
      const data = await r.json()
      const actualRole = data.user?.role

      // The selected account type is a UX guard, not the source of truth for
      // authorization — the backend already knows the real role from the JWT.
      // We just refuse to proceed if what the person picked doesn't match the
      // account they actually logged into, so they don't land somewhere
      // confusing or assume they signed in as the wrong role.
      if (actualRole !== accountType) {
        setError(
          `This account is registered as ${roleLabel(actualRole)}, not ${roleLabel(accountType)}. Please select the correct account type.`
        )
        return
      }

      localStorage.setItem('smartwater.accessToken', data.accessToken)
      localStorage.setItem('smartwater.refreshToken', data.refreshToken || '')
      const dashboards = { SUPER_ADMIN: '/super-admin/dashboard', COMMUNITY_ADMIN: '/admin/dashboard', RESIDENT: '/resident/dashboard' }
      navigate(dashboards[actualRole] || '/login', { replace: true })
    } catch {
      setError("Couldn't reach the server. Make sure the Spring Boot backend is running on port 8082.")
    } finally {
      setLoading(false)
    }
  }

  function roleLabel(role) {
    return ACCOUNT_TYPES.find((t) => t.value === role)?.label || role || 'an unknown role'
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-sky-50 via-teal-50/50 to-white px-5 py-10">
      <div
        className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="animate-blob absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl"
        style={{ animationDelay: '2s' }}
        aria-hidden="true"
      />
      <BuildingsSkyline className="absolute bottom-0 left-0 h-40 w-full opacity-60 blur-[3px] sm:h-56" />

      <Link
        to="/"
        className="group absolute left-6 top-6 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-all hover:border-sky-300 hover:text-sky-700 hover:shadow-md sm:left-8 sm:top-8"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        Back to home
      </Link>

      <Reveal className="relative w-full max-w-[360px]">
        <section className="rounded-xl border border-slate-200 bg-white/90 p-7 shadow-lg shadow-sky-900/5 backdrop-blur sm:p-8">
        <div className="mb-7 text-center">
          <Link to="/" className="inline-grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
            <Droplets size={22} aria-hidden="true" />
          </Link>
          <h1 className="font-display mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Smart water billing
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your apartment account</p>
        </div>

        <form onSubmit={submit} noValidate autoComplete="off">
          <p className="block text-sm font-medium text-slate-700">Account type</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccountType(value)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-bold transition-colors cursor-pointer ${
                  accountType === value
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="email">
            User ID (email)
          </label>
          <input
            id="email"
            name="user_email_no_autofill"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@apartment.com"
            autoComplete="off"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
          />

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="user_pass_no_autofill"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
          />

          <div className="mt-3 text-right">
            <a href="#forgot-password" className="text-sm text-sky-700 hover:text-sky-800">
              Forgot password?
            </a>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Resident and Community Admin accounts are created by your apartment's administration.
          Contact them if you don't have login access yet.
        </p>
        </section>
      </Reveal>
    </main>
  )
}
