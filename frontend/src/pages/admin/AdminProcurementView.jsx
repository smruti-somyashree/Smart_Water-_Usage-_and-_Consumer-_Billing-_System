import { ArrowDown, ArrowUp, CheckCircle2, Edit2, Plus, Search, Trash2, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminProcurementView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [purchases, setPurchases] = useState([])
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedCycleId, setSelectedCycleId] = useState('')
  const [source, setSource] = useState('Tanker')
  const [purchasedOn, setPurchasedOn] = useState(new Date().toISOString().split('T')[0])
  const [volumeKl, setVolumeKl] = useState('20')
  const [unitCost, setUnitCost] = useState('15')
  const [notes, setNotes] = useState('')

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCycleId, setFilterCycleId] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('DESC') // DESC = latest date first
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Notifications
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch cycles
      const cRes = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, { headers })
      if (cRes.ok) {
        const cList = await cRes.json()
        setCycles(cList)
        if (cList.length > 0 && !selectedCycleId) {
          setSelectedCycleId(cList[0].id.toString())
        }
      }

      // Fetch all procurement records
      await fetchPurchases()
    } catch {
      setErrorMsg('Failed to load procurement module data.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPurchases() {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/procurements`, { headers })
      if (r.ok) {
        const data = await r.json()
        setPurchases(data)
      }
    } catch {
      setErrorMsg('Failed to refresh procurement history list.')
    }
  }

  function resetForm() {
    setEditingId(null)
    setSource('Tanker')
    setPurchasedOn(new Date().toISOString().split('T')[0])
    setVolumeKl('20')
    setUnitCost('15')
    setNotes('')
  }

  function handleOpenCreateForm() {
    resetForm()
    setShowForm(true)
    setActionMsg('')
    setErrorMsg('')
  }

  function handleOpenEditForm(p) {
    setEditingId(p.id)
    if (p.billingCycleId) setSelectedCycleId(p.billingCycleId.toString())
    setSource(p.source || 'Tanker')
    setPurchasedOn(p.purchasedOn || new Date().toISOString().split('T')[0])
    setVolumeKl(p.volumeKl ? p.volumeKl.toString() : '20')
    setUnitCost(p.unitCost ? p.unitCost.toString() : '15')
    setNotes(p.notes || '')
    setShowForm(true)
    setActionMsg('')
    setErrorMsg('')
  }

  async function handleSubmitForm(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')

    const vol = parseFloat(volumeKl)
    const cost = parseFloat(unitCost)

    if (isNaN(vol) || vol <= 0) {
      setErrorMsg('Volume (kL) must be greater than 0.')
      return
    }
    if (isNaN(cost) || cost <= 0) {
      setErrorMsg('Unit cost (₹/kL) must be greater than 0.')
      return
    }
    if (!purchasedOn) {
      setErrorMsg('Purchase date cannot be empty.')
      return
    }

    const payload = {
      billingCycleId: selectedCycleId ? parseInt(selectedCycleId) : null,
      source: source.trim(),
      purchasedOn,
      volumeKl: vol,
      unitCost: cost,
      notes: notes.trim(),
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      let url = `${apiBaseUrl}/api/procurements`
      let method = 'POST'

      if (editingId) {
        url = `${apiBaseUrl}/api/procurements/${editingId}`
        method = 'PUT'
      }

      const r = await fetch(url, { method, headers, body: JSON.stringify(payload) })

      if (r.ok) {
        const pRes = await r.json()
        const pCode = pRes.procurementCode || `PR-${String(pRes.id).padStart(3, '0')}`
        setActionMsg(
          editingId
            ? `Procurement record ${pCode} updated successfully!`
            : `New water procurement record ${pCode} saved successfully!`
        )
        setShowForm(false)
        resetForm()
        await fetchPurchases() // Auto-refresh table!
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Error saving procurement record.')
      }
    } catch {
      setErrorMsg('Network error while saving procurement record.')
    }
  }

  async function handleDelete(p) {
    const pCode = p.procurementCode || `PR-${String(p.id).padStart(3, '0')}`
    if (!confirm(`Are you sure you want to delete procurement record ${pCode}?`)) return
    setActionMsg('')
    setErrorMsg('')

    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/procurements/${p.id}`, {
        method: 'DELETE',
        headers,
      })

      if (r.ok) {
        setActionMsg(`Procurement record ${pCode} deleted successfully.`)
        await fetchPurchases() // Auto-refresh table!
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Error deleting procurement record.')
      }
    } catch {
      setErrorMsg('Network error deleting procurement record.')
    }
  }

  // Filter, Search, Sort Logic
  let processed = [...purchases]

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    processed = processed.filter(
      (p) => p.source.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q))
    )
  }

  if (filterCycleId !== 'ALL') {
    processed = processed.filter((p) => p.billingCycleId?.toString() === filterCycleId)
  }

  processed.sort((a, b) => {
    const dA = new Date(a.purchasedOn).getTime()
    const dB = new Date(b.purchasedOn).getTime()
    return sortOrder === 'DESC' ? dB - dA : dA - dB
  })

  // Pagination Logic
  const totalItems = processed.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedPurchases = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const calculatedTotalCost = (
    (parseFloat(volumeKl) || 0) * (parseFloat(unitCost) || 0)
  ).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck size={22} className="text-teal-600" /> Water Procurement Management Module
          </h2>
          <p className="text-xs text-slate-500">
            Record, search, filter, edit, and audit water procurement deliveries (Tanker / Municipal).
          </p>
        </div>

        <button
          onClick={handleOpenCreateForm}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
        >
          <Plus size={16} /> + Record New Delivery
        </button>
      </div>

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

      {/* Form (Create / Edit) */}
      {showForm && (
        <form onSubmit={handleSubmitForm} className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 to-sky-50/90 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-teal-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              {editingId ? `Edit Procurement Record` : 'Record New Bulk Water Delivery'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Billing Cycle</label>
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
              >
                {cycles.map((c) => {
                  const cCode = c.cycleCode || `BC-${String(c.id).padStart(3, '0')}`
                  return (
                    <option key={c.id} value={c.id.toString()}>
                      {cCode} ({formatDate(c.startsOn)} to {formatDate(c.endsOn)}) [{c.status}]
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Water Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold"
              >
                <option value="Municipal">Municipal Water Supply</option>
                <option value="Tanker">Private Tanker Delivery</option>
                <option value="Borewell">Borewell Maintenance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Purchase Date</label>
              <input
                type="date"
                value={purchasedOn}
                onChange={(e) => setPurchasedOn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Purchased Volume (kL)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={volumeKl}
                onChange={(e) => setVolumeKl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-bold text-teal-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Unit Cost (₹/kL)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-bold text-teal-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Auto Total Cost (₹)</label>
              <input
                type="text"
                value={`₹${calculatedTotalCost}`}
                readOnly
                className="mt-1 w-full rounded-lg border border-teal-200 bg-teal-100/60 p-2 text-sm font-extrabold text-teal-900 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Notes / Invoice Voucher Ref</label>
            <input
              type="text"
              placeholder="e.g. Tanker Receipt #TK-90812"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer shadow-xs"
            >
              {editingId ? 'Save Updates' : 'Save Procurement Record'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Toolbar: Search, Filter, Sort, Page Size */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search source or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 rounded-lg border border-slate-300 bg-white px-3 py-1.5 pl-8 text-xs focus:outline-none"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
          </div>

          {/* Filter by Cycle */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-500">Cycle:</span>
            <select
              value={filterCycleId}
              onChange={(e) => setFilterCycleId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium"
            >
              <option value="ALL">All Cycles</option>
              {cycles.map((c) => {
                const cCode = c.cycleCode || `BC-${String(c.id).padStart(3, '0')}`
                return (
                  <option key={c.id} value={c.id.toString()}>
                    {cCode} ({formatDate(c.startsOn)} to {formatDate(c.endsOn)})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer"
          >
            Sort Date: {sortOrder === 'DESC' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          </button>

          {/* Page Size */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value))
                setCurrentPage(1)
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      </div>

      {/* Procurements History Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Procurement ID</th>
              <th className="px-4 py-3">Purchase Date (DD-MM-YYYY)</th>
              <th className="px-4 py-3">Billing Cycle</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Volume (kL)</th>
              <th className="px-4 py-3">Unit Cost (₹/kL)</th>
              <th className="px-4 py-3 font-extrabold text-teal-800">Total Cost (₹)</th>
              <th className="px-4 py-3">Recorded Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-xs text-slate-500">
                  Loading procurement records...
                </td>
              </tr>
            ) : paginatedPurchases.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-xs text-slate-500">
                  No procurement records match the criteria.
                </td>
              </tr>
            ) : (
              paginatedPurchases.map((p) => {
                const pCode = p.procurementCode || `PR-${String(p.id).padStart(3, '0')}`
                const cCode = p.cycleCode || (p.billingCycleId ? `BC-${String(p.billingCycleId).padStart(3, '0')}` : 'BC-001')
                const totalCostVal = p.totalCost || p.volumeKl * p.unitCost
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-extrabold font-mono text-slate-900">
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
                        {pCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatDate(p.purchasedOn)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded bg-sky-50 px-2 py-0.5 font-bold text-sky-800 border border-sky-100 font-mono">
                        {cCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.source}</td>
                    <td className="px-4 py-3">{p.volumeKl} kL</td>
                    <td className="px-4 py-3">{formatCurrency(p.unitCost)}</td>
                    <td className="px-4 py-3 font-extrabold text-teal-700">
                      {formatCurrency(totalCostVal)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-500">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditForm(p)}
                          className="rounded p-1 text-sky-600 hover:bg-sky-50 cursor-pointer"
                          title="Edit Procurement Record"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete Procurement Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <div>
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
        </div>
        <div className="flex gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-300 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
          >
            Previous
          </button>
          <span className="px-3 py-1 font-bold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-slate-300 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
