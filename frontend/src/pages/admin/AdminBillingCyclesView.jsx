import { CheckCircle2, Eye, Layers, Plus, RefreshCw, Truck, FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminBillingCyclesView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [cycles, setCycles] = useState([])
  const [tariffPlans, setTariffPlans] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startsOn, setStartsOn] = useState(new Date().toISOString().split('T')[0])
  const [endsOn, setEndsOn] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  )

  // Details Modal state
  const [selectedCycleDetails, setSelectedCycleDetails] = useState(null)
  const [cyclePurchases, setCyclePurchases] = useState([])
  const [cycleInvoices, setCycleInvoices] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Notifications
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchCycles()
    fetchTariffPlans()
  }, [])

  async function fetchCycles() {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, { headers })
      if (r.ok) {
        const data = await r.json()
        setCycles(data)
      }
    } catch {
      setErrorMsg('Failed to connect to backend service.')
    }
  }

  async function fetchTariffPlans() {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/tariff-plans`, { headers })
      if (r.ok) {
        const data = await r.json()
        setTariffPlans(data)
        if (data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(data[0].id.toString())
        }
      }
    } catch {
      // Ignore
    }
  }

  async function handleCreateCycle(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')

    if (!startsOn || !endsOn) {
      setErrorMsg('Please select valid start and end dates.')
      return
    }

    if (new Date(startsOn) > new Date(endsOn)) {
      setErrorMsg('Start date cannot be after end date.')
      return
    }

    const payload = {
      tariffPlanId: selectedPlanId ? parseInt(selectedPlanId) : null,
      startsOn,
      endsOn,
    }

    try {
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (r.ok) {
        const created = await r.json()
        const code = created.cycleCode || `BC-${String(created.id).padStart(3, '0')}`
        setActionMsg(`New OPEN billing cycle ${code} created successfully!`)
        setShowCreateForm(false)
        await fetchCycles() // Immediate table refresh!
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Error creating billing cycle.')
      }
    } catch {
      setErrorMsg('Network error while creating billing cycle.')
    }
  }

  async function handleViewDetails(c) {
    setSelectedCycleDetails(c)
    setLoadingDetails(true)
    setCyclePurchases([])
    setCycleInvoices([])
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const pRes = await fetch(`${apiBaseUrl}/api/billing-cycles/${c.id}/purchases`, { headers })
      if (pRes.ok) setCyclePurchases(await pRes.json())

      const iRes = await fetch(`${apiBaseUrl}/api/billing-cycles/${c.id}/invoices`, { headers })
      if (iRes.ok) setCycleInvoices(await iRes.json())
    } catch {
      // Ignore
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleFinalize(id, cycleCode) {
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/billing-cycles/${id}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const generatedInvs = await r.json()
        const code = cycleCode || `BC-${String(id).padStart(3, '0')}`
        setActionMsg(`Billing cycle ${code} FINALIZED! Generated ${generatedInvs.length} household invoices.`)
        await fetchCycles() // Immediate table refresh!
        if (selectedCycleDetails?.id === id) {
          handleViewDetails({ ...selectedCycleDetails, status: 'FINALIZED' })
        }
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Failed to finalize billing cycle.')
      }
    } catch {
      setErrorMsg('Network error finalizing billing cycle.')
    }
  }

  async function handleArchive(id, cycleCode) {
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/billing-cycles/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const code = cycleCode || `BC-${String(id).padStart(3, '0')}`
        setActionMsg(`Billing cycle ${code} archived successfully.`)
        await fetchCycles() // Immediate table refresh!
        if (selectedCycleDetails?.id === id) {
          setSelectedCycleDetails(null)
        }
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Failed to archive billing cycle.')
      }
    } catch {
      setErrorMsg('Network error archiving billing cycle.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers size={22} className="text-sky-600" /> Billing Cycle Lifecycle Management
          </h2>
          <p className="text-xs text-slate-500">Manage OPEN, FINALIZED, and ARCHIVED billing cycles with automated invoice generation.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCycles}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setActionMsg('')
              setErrorMsg('')
            }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
          >
            <Plus size={16} /> {showCreateForm ? 'Cancel' : '+ Create OPEN Cycle'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {errorMsg}
        </div>
      )}

      {/* Create Cycle Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateCycle} className="rounded-xl border border-sky-200 bg-sky-50/90 p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-sky-200 pb-2">
            <h3 className="font-bold text-sm text-slate-900">Create New Billing Cycle</h3>
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">Status: OPEN</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Tariff Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
              >
                {tariffPlans.length === 0 ? (
                  <option value="">Default Active Plan (Auto-created)</option>
                ) : (
                  tariffPlans.map((tp) => (
                    <option key={tp.id} value={tp.id.toString()}>
                      {tp.name} (₹{tp.baseRate}/kL base, ₹{tp.excessRate}/kL excess)
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Starts On Date</label>
              <input
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Ends On Date</label>
              <input
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer shadow-xs">
              Save & Open Cycle
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Cycles History Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Cycle Code</th>
              <th className="px-4 py-3">Tariff Plan</th>
              <th className="px-4 py-3">Billing Period (DD-MM-YYYY)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cycles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-xs text-slate-500">
                  No billing cycles stored in database. Click "+ Create OPEN Cycle" to start.
                </td>
              </tr>
            ) : (
              cycles.map((c) => {
                const code = c.cycleCode || `BC-${String(c.id).padStart(3, '0')}`
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-xs font-extrabold text-sky-700 border border-sky-200">
                        {code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {c.tariffPlanName || 'Standard Plan'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatDate(c.startsOn)} to {formatDate(c.endsOn)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                          c.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : c.status === 'FINALIZED'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(c)}
                          className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          <Eye size={14} /> View
                        </button>

                        {c.status === 'OPEN' && (
                          <button
                            onClick={() => handleFinalize(c.id, code)}
                            className="rounded bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer shadow-xs"
                          >
                            Finalize Cycle
                          </button>
                        )}
                        {c.status === 'FINALIZED' && (
                          <button
                            onClick={() => handleArchive(c.id, code)}
                            className="rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer shadow-xs"
                          >
                            Archive Cycle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cycle Detail View Modal */}
      {selectedCycleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {selectedCycleDetails.cycleCode || `BC-${String(selectedCycleDetails.id).padStart(3, '0')}`}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                  Billing Cycle Audit & Metrics Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedCycleDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Billing Period</span>
                <span className="font-bold text-slate-900">
                  {formatDate(selectedCycleDetails.startsOn)} to {formatDate(selectedCycleDetails.endsOn)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Status</span>
                <span className="font-bold uppercase text-sky-700">{selectedCycleDetails.status}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Applied Tariff Plan</span>
                <span className="font-bold text-slate-900">{selectedCycleDetails.tariffPlanName || 'Standard Plan'}</span>
              </div>
            </div>

            {loadingDetails ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading cycle procurement and invoice metrics...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4">
                    <span className="text-xs font-bold text-teal-800 uppercase flex items-center gap-1">
                      <Truck size={14} /> Water Procurement Deliveries
                    </span>
                    <div className="mt-2 text-xl font-extrabold text-teal-900">
                      {cyclePurchases.length} deliveries
                    </div>
                    <p className="text-xs text-teal-700 mt-0.5">
                      Total Volume:{' '}
                      {cyclePurchases.reduce((acc, p) => acc + (p.volumeKl || 0), 0)} kL
                    </p>
                  </div>

                  <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
                    <span className="text-xs font-bold text-sky-800 uppercase flex items-center gap-1">
                      <FileText size={14} /> Generated Household Invoices
                    </span>
                    <div className="mt-2 text-xl font-extrabold text-sky-900">
                      {cycleInvoices.length} invoices
                    </div>
                    <p className="text-xs text-sky-700 mt-0.5">
                      Total Billed Revenue:{' '}
                      {formatCurrency(cycleInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0))}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  {selectedCycleDetails.status === 'OPEN' && (
                    <button
                      onClick={() => handleFinalize(selectedCycleDetails.id, selectedCycleDetails.cycleCode)}
                      className="rounded bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
                    >
                      Finalize Cycle Now
                    </button>
                  )}
                  {selectedCycleDetails.status === 'FINALIZED' && (
                    <button
                      onClick={() => handleArchive(selectedCycleDetails.id, selectedCycleDetails.cycleCode)}
                      className="rounded bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                    >
                      Archive Cycle
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCycleDetails(null)}
                    className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
