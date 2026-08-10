import { AlertCircle, CheckCircle2, CreditCard, DollarSign, Download, FileText, Filter, Play, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminInvoicesView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [invoices, setInvoices] = useState([])
  const [cycles, setCycles] = useState([])
  const [selectedCycleId, setSelectedCycleId] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchCyclesAndInvoices()
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [selectedCycleId])

  async function fetchCyclesAndInvoices() {
    setLoading(true)
    setErrorMsg('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const cRes = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, { headers })
      if (cRes.ok) {
        const cList = await cRes.json()
        setCycles(cList)
      }
      await fetchInvoices()
    } catch {
      setErrorMsg('Failed to load data from backend server.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchInvoices() {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      let url = `${apiBaseUrl}/api/billing-cycles/invoices`
      if (selectedCycleId !== 'ALL') {
        url = `${apiBaseUrl}/api/billing-cycles/${selectedCycleId}/invoices`
      }
      const res = await fetch(url, { headers })
      if (res.ok) {
        const invList = await res.json()
        invList.sort((a, b) => b.id - a.id)
        setInvoices(invList)
      }
    } catch {
      // ignore
    }
  }

  async function handleFinalizeCycle(cycleId) {
    setGenerating(true)
    setActionMsg('')
    setErrorMsg('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await fetch(`${apiBaseUrl}/api/billing-cycles/${cycleId}/finalize`, {
        method: 'POST',
        headers,
      })
      if (res.ok) {
        const generatedInvoices = await res.json()
        setActionMsg(`Successfully finalized cycle! ${generatedInvoices.length} invoices generated.`)
        await fetchCyclesAndInvoices()
      } else {
        const err = await res.json()
        setErrorMsg(err.message || 'Failed to finalize billing cycle.')
      }
    } catch {
      setErrorMsg('Error connecting to backend server.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleMarkPaid(inv) {
    const invCode = inv.invoiceCode ? `id ${inv.invoiceCode}` : `id ${inv.id}`
    try {
      const r = await fetch(`${apiBaseUrl}/api/billing-cycles/invoices/${inv.id}/pay`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        setActionMsg(`Payment confirmed and verified for Invoice ${invCode}! Resident will now see this as Confirmed Payment.`)
        fetchInvoices()
      }
    } catch {
      setErrorMsg('Error confirming invoice payment.')
    }
  }

  async function handleDownload(inv) {
    const invCode = inv.invoiceCode ? `id ${inv.invoiceCode}` : `id ${inv.id}`
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await fetch(`${apiBaseUrl}/api/invoices/${inv.id}/pdf`, { headers })
      if (!res.ok) throw new Error('PDF Generation Failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SmartWater_Invoice_${invCode.replace(/\s+/g, '_')}_Flat_${inv.flatNumber || inv.householdId}.pdf`
      a.click()
      setActionMsg(`Downloaded official PDF Invoice for ${invCode}!`)
    } catch {
      setErrorMsg('Failed to download PDF invoice.')
    }
  }

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const invCode = inv.invoiceCode ? `id ${inv.invoiceCode}` : `id ${inv.id}`
    const flat = inv.flatNumber || ''
    const matchesSearch = invCode.toLowerCase().includes(searchQuery.toLowerCase()) || flat.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter.toUpperCase()
    return matchesSearch && matchesStatus
  })

  // Pending Resident Payment Submissions
  const pendingConfirmations = invoices.filter((i) => i.status === 'PENDING_VERIFICATION')

  // Open billing cycle check
  const openCycle = cycles.find((c) => c.status === 'OPEN')

  // Summary Metrics
  const totalBilled = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
  const totalUnpaid = invoices.filter((i) => i.status !== 'PAID').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={22} className="text-sky-600" /> Itemized Household Invoices & Payment Approval
          </h2>
          <p className="text-xs text-slate-500">
            View generated bills, verify resident online payments, and mark confirmed payments for residents.
          </p>
        </div>
        {openCycle && (
          <button
            onClick={() => handleFinalizeCycle(openCycle.id)}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {generating ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
            Generate Invoices for {openCycle.cycleCode || `BC-${String(openCycle.id).padStart(3, '0')}`}
          </button>
        )}
      </div>

      {/* Action and Error Messages */}
      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900 flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* PENDING RESIDENT PAYMENT CONFIRMATIONS SECTION */}
      {pendingConfirmations.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div>
              <h3 className="font-display text-base font-extrabold text-amber-950 flex items-center gap-2">
                <CreditCard size={20} className="text-amber-600" /> Pending Resident Payment Confirmations
              </h3>
              <p className="text-xs text-amber-800">
                Residents have submitted online payment details for these invoices. Verify the transaction reference and click <strong>Verify & Confirm Payment</strong> to mark as confirmed.
              </p>
            </div>
            <span className="rounded-full bg-amber-200/80 px-3.5 py-1 text-xs font-black text-amber-900 border border-amber-300">
              {pendingConfirmations.length} Pending Approval{pendingConfirmations.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {pendingConfirmations.map((inv) => {
              const invCode = inv.invoiceCode ? `Id ${inv.invoiceCode}` : `Id ${inv.id}`
              return (
                <div key={inv.id} className="rounded-xl bg-white p-4 border border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-xs text-amber-950 font-mono block">{invCode}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">Flat {inv.flatNumber}</span>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
                      PAYMENT SUBMITTED BY RESIDENT
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Bill Amount:</span>
                    <span className="font-display font-extrabold text-slate-900 text-base">{formatCurrency(inv.totalAmount)}</span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] space-y-1 text-slate-600 border border-slate-100">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-bold text-slate-900">{inv.paymentMethod || 'UPI'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction Ref:</span>
                      <span className="font-mono font-bold text-slate-900">{inv.transactionRef || 'N/A'}</span>
                    </div>
                    {inv.paidAt && (
                      <div className="flex justify-between">
                        <span>Submitted Time:</span>
                        <span className="font-semibold text-slate-800">{formatDate(inv.paidAt)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleMarkPaid(inv)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Verify & Confirm Payment for Resident
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* OPEN Cycle Generation Banner */}
      {openCycle && invoices.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Active Billing Cycle {openCycle.cycleCode || `BC-${String(openCycle.id).padStart(3, '0')}`} is Currently OPEN
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Invoices have not been calculated yet for this cycle ({formatDate(openCycle.startsOn)} to {formatDate(openCycle.endsOn)}). Click "Generate Invoices Now" to calculate tiered charges and shared tanker costs for all households.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleFinalizeCycle(openCycle.id)}
            disabled={generating}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {generating ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
            Generate Invoices Now
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Invoices</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{invoices.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Billed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalBilled)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-xs font-medium text-emerald-700">Total Confirmed Paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-xs font-medium text-amber-700">Pending / Unpaid</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{formatCurrency(totalUnpaid)}</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Cycle Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Billing Cycles</option>
              {cycles.map((c) => {
                const code = c.cycleCode || `BC-${String(c.id).padStart(3, '0')}`
                return (
                  <option key={c.id} value={c.id}>
                    {code} ({c.status})
                  </option>
                )
              })}
            </select>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
            <option value="PAID">PAID</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search flat number or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">INVOICE ID</th>
              <th className="px-4 py-3">BILLING CYCLE</th>
              <th className="px-4 py-3">HOUSEHOLD FLAT</th>
              <th className="px-4 py-3">CONSUMPTION</th>
              <th className="px-4 py-3">BASE CHARGE (₹)</th>
              <th className="px-4 py-3">EXCESS CHARGE (₹)</th>
              <th className="px-4 py-3">SHARED TANKER (₹)</th>
              <th className="px-4 py-3 font-bold text-slate-900">TOTAL BILL (₹)</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-xs text-slate-500">
                  <RefreshCw className="animate-spin inline mr-2" size={16} /> Loading invoices...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-xs text-slate-500">
                  No invoices found for the selected filter.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const displayCode = inv.invoiceCode ? `id ${inv.invoiceCode}` : `id ${inv.id}`
                const cCode = inv.cycleCode || `BC-${String(inv.billingCycleId).padStart(3, '0')}`
                const isPending = inv.status === 'PENDING_VERIFICATION'
                const isPaid = inv.status === 'PAID'

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-extrabold font-mono text-slate-900">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-200 font-mono">
                        {displayCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-mono">
                        {cCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{inv.flatNumber || `Flat A-${inv.householdId}`}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{inv.consumptionKl} kL</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(inv.baseAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(inv.excessAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(inv.sharedAmount)}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} /> PAID
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                          SUBMITTED BY RESIDENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                          UNPAID
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!isPaid && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            {isPending ? 'Verify & Confirm' : 'Mark Paid'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(inv)}
                          title="Download Invoice Text Voucher"
                          className="rounded-lg bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                        >
                          <Download size={15} />
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
    </div>
  )
}
