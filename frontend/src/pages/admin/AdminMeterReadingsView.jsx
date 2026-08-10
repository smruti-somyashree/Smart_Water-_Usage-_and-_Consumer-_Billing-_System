import { CheckCircle2, Droplets, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminMeterReadingsView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [households, setHouseholds] = useState([])
  const [usageLogs, setUsageLogs] = useState([])
  const [selectedHh, setSelectedHh] = useState('')
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0])
  const [meterReadingKl, setMeterReadingKl] = useState('14.5')
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchHouseholds()
    fetchUsageLogs()
  }, [])

  async function fetchHouseholds() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/apartments/1/households`, { headers })
    if (r.ok) {
      const data = await r.json()
      setHouseholds(data)
      if (data.length > 0 && !selectedHh) setSelectedHh(data[0].id.toString())
    }
  }

  async function fetchUsageLogs() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/households/usage`, { headers })
    if (r.ok) {
      const data = await r.json()
      data.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())
      setUsageLogs(data)
    }
  }

  async function handleLogReading(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/households/${selectedHh}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          readingDate,
          meterReadingKl: parseFloat(meterReadingKl),
        }),
      })
      if (r.ok) {
        const logRes = await r.json()
        const rCode = logRes.readingCode || `MR-${String(logRes.id).padStart(3, '0')}`
        setActionMsg(`Meter reading ${rCode} (${meterReadingKl} kL) logged successfully!`)
        fetchUsageLogs() // Auto-refresh table!
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Error logging reading.')
      }
    } catch {
      setErrorMsg('Failed to log reading.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
          <Droplets size={22} className="text-sky-600" /> Meter Reading Entry & Usage Management
        </h2>
        <p className="text-xs text-slate-500">Record daily or monthly water meter readings per household.</p>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900 flex items-center gap-2">
          {errorMsg}
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={handleLogReading} className="rounded-xl border border-sky-200 bg-white p-6 shadow-xs space-y-4 max-w-2xl">
        <h3 className="font-bold text-sm text-slate-900">Log Household Meter Reading</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Select Flat</label>
            <select value={selectedHh} onChange={(e) => setSelectedHh(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm">
              {households.map((h) => (
                <option key={h.id} value={h.id}>Flat {h.flatNumber} ({h.hasMeter ? 'Metered' : 'Unmetered'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Reading Date</label>
            <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Reading (kL)</label>
            <input type="number" step="0.1" value={meterReadingKl} onChange={(e) => setMeterReadingKl(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
          </div>
        </div>
        <button type="submit" className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer">
          Submit Reading
        </button>
      </form>

      {/* Meter Readings History Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Meter Readings History (Latest First)
        </div>
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Reading Code</th>
              <th className="px-4 py-3">Household Flat</th>
              <th className="px-4 py-3">Reading Date (DD-MM-YYYY)</th>
              <th className="px-4 py-3 font-bold text-sky-800">Meter Reading (kL)</th>
              <th className="px-4 py-3">Entry Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usageLogs.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-xs text-slate-500">No meter readings recorded yet.</td></tr>
            ) : (
              usageLogs.map((log) => {
                const rCode = log.readingCode || `MR-${String(log.id).padStart(3, '0')}`
                return (
                  <tr key={log.id}>
                    <td className="px-4 py-3 font-extrabold font-mono text-slate-900">
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-xs text-sky-800 border border-sky-200 font-mono">
                        {rCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">Flat {log.flatNumber || `A-${log.householdId}`}</td>
                    <td className="px-4 py-3 font-semibold">{formatDate(log.readingDate)}</td>
                    <td className="px-4 py-3 font-bold text-sky-700">{log.meterReadingKl} kL</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {log.source}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
