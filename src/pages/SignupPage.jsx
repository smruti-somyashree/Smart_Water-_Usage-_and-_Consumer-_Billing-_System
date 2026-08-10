import { ArrowLeft, Droplets } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export default function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('RESIDENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!fullName || !email || !password || !confirmPassword) {
      return setError('All fields are required.')
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
      const r = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      })

      if (!r.ok) {
        const body = await r.json().catch(() => null)
        setError(body?.message || 'Could not create your account. Try a different email.')
        return
      }

      navigate('/login', { replace: true, state: { justRegistered: true } })
    } catch {
      setError("Couldn't reach the server.")
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

      <Link
        to="/"
        className="absolute left-6 top-6 flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-sky-700 sm:left-8 sm:top-8"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to home
      </Link>

      <section className="relative w-full max-w-[380px] rounded-xl border border-slate-200 bg-white/90 p-7 shadow-sm backdrop-blur sm:p-8">
        <div className="mb-7 text-center">
          <Link to="/" className="inline-grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
            <Droplets size={22} aria-hidden="true" />
          </Link>
          <h1 className="font-display mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">Set up access for your apartment</p>
        </div>

        <form onSubmit={submit} noValidate>
          <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-sky-600"
          />

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
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
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                role === 'RESIDENT'
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
            >
              Resident
            </button>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                role === 'ADMIN'
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="mt-5 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-70"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
