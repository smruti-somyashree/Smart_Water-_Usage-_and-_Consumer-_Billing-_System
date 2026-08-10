import { ArrowLeft, Droplets } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Email and password are required.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')

    setLoading(true)
    try {
      const r = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!r.ok) {
        setError('Incorrect email or password.')
        return
      }
      const data = await r.json()
      localStorage.setItem('smartwater.accessToken', data.accessToken)
      localStorage.setItem('smartwater.refreshToken', data.refreshToken || '')
      navigate(data.user?.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
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

      <section className="relative w-full max-w-[340px] rounded-xl border border-slate-200 bg-white/90 p-7 shadow-sm backdrop-blur sm:p-8">
        <div className="mb-7 text-center">
          <Link to="/" className="inline-grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
            <Droplets size={22} aria-hidden="true" />
          </Link>
          <h1 className="font-display mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Smart water billing
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your apartment account</p>
        </div>

        <form onSubmit={submit} noValidate>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
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
            placeholder="Enter your password"
            autoComplete="current-password"
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

        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-medium text-sky-700 hover:text-sky-800">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  )
}
