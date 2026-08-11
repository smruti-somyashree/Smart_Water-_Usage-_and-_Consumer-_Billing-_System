import { ArrowLeft, CheckCircle2, Droplets, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BuildingsSkyline from '../components/BuildingsSkyline'
import Reveal from '../components/Reveal'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

export default function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('RESIDENT')
  const [flatNumber, setFlatNumber] = useState('')
  const [occupancyCount, setOccupancyCount] = useState('3')
  const [flatSizeSqft, setFlatSizeSqft] = useState('1200')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  function handleClear() {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFlatNumber('')
    setOccupancyCount('3')
    setFlatSizeSqft('1200')
    setError('')
    setSuccessMsg('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!fullName || !email || !password || !confirmPassword) {
      return setError('All fields are required.')
    }
    if (role === 'RESIDENT' && !flatNumber.trim()) {
      return setError('Apartment / Flat number is required for Resident registration.')
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError('Enter a valid email address.')
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const payload = {
        apartmentId: 1,
        name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        flatNumber: role === 'RESIDENT' ? flatNumber.trim().toUpperCase() : null,
        occupancyCount: role === 'RESIDENT' ? parseInt(occupancyCount) || 3 : null,
        flatSizeSqft: role === 'RESIDENT' ? parseInt(flatSizeSqft) || 1200 : null,
      }

      const r = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!r.ok) {
        const body = await r.json().catch(() => null)
        setError(body?.message || 'Could not create your account. Try a different email.')
        return
      }

      const createdUser = await r.json()

      if (role === 'RESIDENT') {
        setSuccessMsg('Account created successfully! Your registration is pending approval by the Apartment Administrator. Once approved, you will be able to log in.')
      } else {
        navigate('/login', { replace: true, state: { justRegistered: true } })
      }
    } catch {
      setError("Couldn't reach the server. Make sure the Spring Boot backend is running on port 8082.")
    } finally {
      setLoading(false)
    }
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

      <Reveal className="relative w-full max-w-[420px]">
        <section className="rounded-xl border border-slate-200 bg-white/90 p-7 shadow-lg shadow-sky-900/5 backdrop-blur sm:p-8">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
              <Droplets size={22} aria-hidden="true" />
            </Link>
            <h1 className="font-display mt-4 text-xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-500">Set up access for your apartment</p>
          </div>

          {successMsg ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-center space-y-3">
              <CheckCircle2 size={32} className="mx-auto text-teal-600" />
              <h3 className="font-bold text-teal-900 text-base">Registration Submitted!</h3>
              <p className="text-xs text-teal-800 leading-relaxed">{successMsg}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full rounded-lg bg-teal-600 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors cursor-pointer"
              >
                Go to Sign In Page
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
              />

              <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@apartment.com"
                autoComplete="email"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
              />

              {/* Resident Household Fields */}
              {role === 'RESIDENT' && (
                <div className="mt-4 rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-teal-200/50 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Apartment Household Details
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950" htmlFor="flatNumber">
                      Flat / Apartment Number *
                    </label>
                    <input
                      id="flatNumber"
                      type="text"
                      required
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="e.g. A-101, B-201, C-301"
                      className="mt-1 w-full rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-teal-950" htmlFor="occupancyCount">
                        Occupants Count *
                      </label>
                      <input
                        id="occupancyCount"
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={occupancyCount}
                        onChange={(e) => setOccupancyCount(e.target.value)}
                        placeholder="e.g. 3"
                        className="mt-1 w-full rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-950" htmlFor="flatSizeSqft">
                        Floor Area (sq. ft.) *
                      </label>
                      <input
                        id="flatSizeSqft"
                        type="number"
                        min="200"
                        max="10000"
                        required
                        value={flatSizeSqft}
                        onChange={(e) => setFlatSizeSqft(e.target.value)}
                        placeholder="e.g. 1200"
                        className="mt-1 w-full rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-teal-800 leading-tight">
                    Occupancy and floor area are used for peer benchmarking and fair water tariff calculations.
                  </p>
                </div>
              )}

              <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
              />

              <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
              />

              <p className="mt-4 text-sm font-medium text-slate-700">Account type</p>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('RESIDENT')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    role === 'RESIDENT'
                      ? 'border-teal-600 bg-teal-600 text-white font-bold'
                      : 'border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  Resident
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    role === 'ADMIN'
                      ? 'border-sky-600 bg-sky-600 text-white font-bold'
                      : 'border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  Admin
                </button>
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              {/* Action Buttons: Clear + Create Account */}
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear all fields"
                  className="col-span-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-xs"
                >
                  <RotateCcw size={14} /> Clear
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="col-span-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:opacity-70 cursor-pointer shadow-xs"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-sky-700 hover:text-sky-800">
              Sign in
            </Link>
          </p>
        </section>
      </Reveal>
    </main>
  )
}
