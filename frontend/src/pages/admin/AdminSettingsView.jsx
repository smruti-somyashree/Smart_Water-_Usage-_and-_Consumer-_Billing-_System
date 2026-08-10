import { AlertTriangle, CheckCircle2, RotateCcw, Save, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminSettingsView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [aptName, setAptName] = useState('Green Valley Society')
  const [address, setAddress] = useState('123 Water Works Road')
  const [totalUnits, setTotalUnits] = useState('50')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [inAppAlerts, setInAppAlerts] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchApartment()
  }, [])

  async function fetchApartment() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/apartments/1`, { headers })
    if (r.ok) {
      const a = await r.json()
      setAptName(a.name)
      setAddress(a.address)
      setTotalUnits(a.totalUnits.toString())
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setActionMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/apartments/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: aptName,
          address,
          totalUnits: parseInt(totalUnits),
        }),
      })
      if (r.ok) {
        setActionMsg('Apartment settings updated successfully!')
      }
    } catch {
      setActionMsg('Error saving settings.')
    }
  }

  async function handleResetAllData() {
    if (!confirm('Are you sure you want to delete all stored input data (cycles, tariffs, procurements, meter readings, invoices, alerts)? This action will reset the database for fresh input.')) return
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/admin/reset-data`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const body = await r.json()
        setActionMsg(body.message || 'All input data has been deleted! The application is now clean for new inputs.')
      } else {
        setErrorMsg('Failed to reset data.')
      }
    } catch {
      setErrorMsg('Error resetting database data.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings size={22} className="text-sky-600" /> Administrator Settings & Reset
          </h2>
          <p className="text-xs text-slate-500">Configure apartment metadata, notification dispatchers, or reset system data.</p>
        </div>

        <button
          onClick={handleResetAllData}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 cursor-pointer"
        >
          <RotateCcw size={16} /> Delete All Data & Start Fresh
        </button>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 max-w-2xl">
        <div className="space-y-4 border-b border-slate-100 pb-4">
          <h3 className="font-bold text-sm text-slate-900">Apartment Details</h3>
          <div>
            <label className="text-xs font-semibold text-slate-700">Apartment Name</label>
            <input value={aptName} onChange={(e) => setAptName(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Total Units</label>
            <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Notification Settings</h3>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} id="ea" className="h-4 w-4 text-sky-600" />
            <label htmlFor="ea" className="text-xs font-semibold text-slate-700">Enable Automated Email Notifications (2σ Spikes & Overuse)</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={inAppAlerts} onChange={(e) => setInAppAlerts(e.target.checked)} id="ia" className="h-4 w-4 text-sky-600" />
            <label htmlFor="ia" className="text-xs font-semibold text-slate-700">Enable In-App Alert Notifications</label>
          </div>
        </div>

        <button type="submit" className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer">
          <Save size={16} /> Save Settings
        </button>
      </form>
    </div>
  )
}
