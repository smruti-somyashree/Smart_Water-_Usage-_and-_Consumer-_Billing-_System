import { CheckCircle2, IndianRupee, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

export default function AdminTariffsView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [plans, setPlans] = useState([])
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('Standard Tiered Rate')
  const [baseThresholdKl, setBaseThresholdKl] = useState('10')
  const [baseRate, setBaseRate] = useState('15')
  const [excessRate, setExcessRate] = useState('25')
  const [overuseThresholdKl, setOveruseThresholdKl] = useState('20')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/apartments/1/tariff-plans`, { headers })
    if (r.ok) setPlans(await r.json())
  }

  async function handleSavePlan(e) {
    e.preventDefault()
    setActionMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/tariff-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          baseThresholdKl: parseFloat(baseThresholdKl),
          baseRate: parseFloat(baseRate),
          excessRate: parseFloat(excessRate),
          overuseThresholdKl: parseFloat(overuseThresholdKl),
          active: true,
        }),
      })
      if (r.ok) {
        setActionMsg('Tariff plan created successfully!')
        setShowForm(false)
        fetchPlans()
      }
    } catch {
      setActionMsg('Error saving plan.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee size={22} className="text-sky-600" /> Tiered Tariff Plan Management
          </h2>
          <p className="text-xs text-slate-500">Configure base tier pricing, excess usage surcharges, and overuse alert limits.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
        >
          <Plus size={16} /> {showForm ? 'Cancel' : '+ Create Tariff Plan'}
        </button>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSavePlan} className="rounded-xl border border-sky-200 bg-sky-50/80 p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900">New Tariff Configuration</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Plan Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Base Limit (kL)</label>
              <input type="number" value={baseThresholdKl} onChange={(e) => setBaseThresholdKl(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Base Rate (₹/kL)</label>
              <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Excess Rate (₹/kL)</label>
              <input type="number" value={excessRate} onChange={(e) => setExcessRate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Overuse Limit (kL)</label>
              <input type="number" value={overuseThresholdKl} onChange={(e) => setOveruseThresholdKl(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm" required />
            </div>
          </div>
          <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer">
            Save Tariff Plan
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">{p.name}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>Base Threshold: <strong className="text-slate-900">{p.baseThresholdKl} kL</strong></div>
              <div>Base Rate: <strong className="text-sky-700">₹{p.baseRate}/kL</strong></div>
              <div>Excess Surcharge: <strong className="text-amber-700">₹{p.excessRate}/kL</strong></div>
              <div>Overuse Limit: <strong className="text-teal-700">{p.overuseThresholdKl} kL</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
