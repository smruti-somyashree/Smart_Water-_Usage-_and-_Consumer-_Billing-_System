import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, IndianRupee, Droplets, Home, Layers, Play, Plus, Search, Truck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminDashboardView({ onNavigate }) {
  const token = localStorage.getItem('smartwater.accessToken')
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const sumRes = await fetch(`${apiBaseUrl}/api/apartments/1/summary`, { headers })
      if (sumRes.ok) setSummary(await sumRes.json())

      const altRes = await fetch(`${apiBaseUrl}/api/alerts`, { headers })
      if (altRes.ok) {
        const altData = await altRes.json()
        altData.sort((a, b) => b.id - a.id)
        setAlerts(altData)
      }

      const cRes = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, { headers })
      if (cRes.ok) {
        const cList = await cRes.json()
        if (cList.length > 0) {
          const activeCycleId = cList[0].id
          const pRes = await fetch(`${apiBaseUrl}/api/billing-cycles/${activeCycleId}/purchases`, { headers })
          if (pRes.ok) {
            const pData = await pRes.json()
            pData.sort((a, b) => new Date(b.purchasedOn).getTime() - new Date(a.purchasedOn).getTime())
            setPurchases(pData)
          }

          const iRes = await fetch(`${apiBaseUrl}/api/billing-cycles/${activeCycleId}/invoices`, { headers })
          if (iRes.ok) setInvoices(await iRes.json())
        }
      }
    } catch {
      setErrorMsg('Failed to load dashboard summary metrics.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRunAudit() {
    setActionMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/alerts/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const res = await r.json()
        setActionMsg(`Audit complete! Evaluated ${res.householdsEvaluated} households.`)
        fetchDashboardData()
      }
    } catch {
      setErrorMsg('Error triggering leak audit.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-500 to-indigo-600 p-6 text-white shadow-md">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Overview Panel</span>
          <h2 className="font-display text-2xl font-bold">Smart Water Apartment System</h2>
          <p className="text-xs text-sky-100 mt-1">Real-time metrics, active alerts, and billing lifecycle management.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('billing')}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/30 cursor-pointer"
          >
            <Plus size={14} /> Create Billing Cycle
          </button>
          <button
            onClick={handleRunAudit}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-amber-300 cursor-pointer"
          >
            <Play size={14} /> Run Leak Detection
          </button>
          <button
            onClick={() => onNavigate('procurement')}
            className="flex items-center gap-1.5 rounded-lg bg-teal-400 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-teal-300 cursor-pointer"
          >
            <Truck size={14} /> Add Procurement
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Total Households</span>
            <Users size={20} className="text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{summary?.totalHouseholds || 0}</span>
            <span className="text-xs font-semibold text-slate-500">
              ({summary?.meteredHouseholds || 0} metered / {summary?.unmeteredHouseholds || 0} unmetered)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Water Purchased</span>
            <Truck size={20} className="text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{summary?.totalWaterPurchasedKl || 0} kL</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Total Revenue</span>
            <IndianRupee size={20} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{formatCurrency(summary?.totalRevenue || 0)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Active Leak Alerts</span>
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{summary?.leakAlertsCount || 0}</span>
            <span className="text-xs text-slate-500">unresolved</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Summaries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="font-display font-bold text-slate-900 mb-2">Water Consumption vs Procurement (kL)</h3>
          <div className="h-44 flex items-end justify-around gap-4 border-b border-slate-200 pb-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 rounded-t bg-teal-500" style={{ height: '75%' }}></div>
              <span className="text-xs font-bold text-slate-700">Procured ({summary?.totalWaterPurchasedKl || 0} kL)</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 rounded-t bg-sky-500" style={{ height: '60%' }}></div>
              <span className="text-xs font-bold text-slate-700">Consumed ({summary?.totalWaterConsumedKl || 0} kL)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="font-display font-bold text-slate-900 mb-2">Billing Status & Collection Ratio</h3>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Paid Invoices ({summary?.paidBillsCount || 0})</span>
                <span className="text-amber-700">Pending Invoices ({summary?.pendingBillsCount || 0})</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-amber-100 flex">
                <div className="bg-emerald-500 h-full" style={{ width: summary?.paidBillsCount ? `${(summary.paidBillsCount / (summary.paidBillsCount + summary.pendingBillsCount)) * 100}%` : '50%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-700">
              <span>Active Cycle Status:</span>
              <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-800 uppercase">{summary?.activeCycleStatus || 'NONE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-900">Recent Procurement Deliveries</h3>
            <button onClick={() => onNavigate('procurement')} className="text-xs font-bold text-sky-600 hover:underline">View All</button>
          </div>
          {purchases.length === 0 ? (
            <p className="text-xs text-slate-500">No recent procurement records.</p>
          ) : (
            <div className="space-y-2">
              {purchases.slice(0, 3).map((p) => {
                const pCode = p.procurementCode || `PR-${String(p.id).padStart(3, '0')}`
                return (
                  <div key={p.id} className="flex justify-between items-center rounded-lg bg-slate-50 p-3 text-xs">
                    <div>
                      <span className="font-bold font-mono text-teal-800 mr-2">{pCode}</span>
                      <span className="font-bold text-slate-900">{p.source}</span>
                      <span className="block text-slate-500">{formatDate(p.purchasedOn)}</span>
                    </div>
                    <span className="font-extrabold text-teal-700">{p.volumeKl} kL ({formatCurrency(p.volumeKl * p.unitCost)})</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-900">Recent Anomaly & Overuse Alerts</h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs font-bold text-sky-600 hover:underline">View All</button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500">No active alerts detected.</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 3).map((a) => {
                const altCode = a.alertCode || `ALT-${String(a.id).padStart(3, '0')}`
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                    <div>
                      <span className="font-bold font-mono text-amber-900 mr-1.5">{altCode}:</span>
                      <span className="font-semibold">{a.message}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
