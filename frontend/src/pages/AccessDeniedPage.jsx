import { AlertOctagon, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function AccessDeniedPage() {
  const navigate = useNavigate()

  function handleGoBack() {
    const token = localStorage.getItem('smartwater.accessToken')
    let role = null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        role = payload.role
      } catch {
        role = null
      }
    }
    if (role === 'RESIDENT') navigate('/resident/dashboard', { replace: true })
    else if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
    else navigate('/login', { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 inline-grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert size={36} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-red-600">HTTP 403 Forbidden</span>
        <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have Administrator permissions to access this page or endpoint. Administrator routes are strictly protected.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </button>
        </div>
      </div>
    </main>
  )
}
