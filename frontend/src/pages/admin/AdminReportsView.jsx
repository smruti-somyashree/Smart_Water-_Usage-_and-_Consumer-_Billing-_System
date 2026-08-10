import { Activity, AlertCircle, BarChart3, Calendar, CheckCircle2, DollarSign, Download, Droplets, FileSpreadsheet, Filter, PieChart, RefreshCw, TrendingUp, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminReportsView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [summary, setSummary] = useState(null)
  const [cycles, setCycles] = useState([])
  const [procurements, setProcurements] = useState([])
  const [usageLogs, setUsageLogs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // ALL, MONTHLY, PROCUREMENTS

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [sRes, cRes, pRes, uRes, iRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/apartments/1/summary`, { headers }),
        fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, { headers }),
        fetch(`${apiBaseUrl}/api/procurements`, { headers }),
        fetch(`${apiBaseUrl}/api/households/usage`, { headers }),
        fetch(`${apiBaseUrl}/api/billing-cycles/invoices`, { headers }),
      ])

      if (sRes.ok) setSummary(await sRes.json())
      if (cRes.ok) setCycles(await cRes.json())
      if (pRes.ok) setProcurements(await pRes.json())
      if (uRes.ok) setUsageLogs(await uRes.json())
      if (iRes.ok) setInvoices(await iRes.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    const todayStr = formatDate(new Date().toISOString().split('T')[0])
    let csvContent = `Metric,Value\nReport Generated Date,${todayStr}\n`
    csvContent += `Total Households,${summary?.totalHouseholds || 0}\n`
    csvContent += `Metered Households,${summary?.meteredHouseholds || 0}\n`
    csvContent += `Unmetered Households,${summary?.unmeteredHouseholds || 0}\n`
    csvContent += `Water Purchased (kL),${summary?.totalWaterPurchasedKl || 0}\n`
    csvContent += `Water Consumed (kL),${summary?.totalWaterConsumedKl || 0}\n`
    csvContent += `Total Revenue (₹),${summary?.totalRevenue || 0}\n`
    csvContent += `Pending Bills Count,${summary?.pendingBillsCount || 0}\n`
    csvContent += `Paid Bills Count,${summary?.paidBillsCount || 0}\n\n`

    csvContent += `INVOICES BREAKDOWN\nInvoice Code,Cycle,Flat,Consumption (kL),Base Charge (₹),Excess Charge (₹),Shared Tanker (₹),Total Bill (₹),Status\n`
    invoices.forEach((inv) => {
      const displayCode = inv.invoiceCode ? `id ${inv.invoiceCode}` : `id ${inv.id}`
      csvContent += `${displayCode},${inv.cycleCode || 'BC-001'},${inv.flatNumber || 'Flat'},${inv.consumptionKl},${inv.baseAmount},${inv.excessAmount},${inv.sharedAmount},${inv.totalAmount},${inv.status}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Apartment_Water_Report_${todayStr}.csv`
    link.click()
    setActionMsg('Report exported as CSV!')
  }

  // Calculate chart metrics
  const totalBase = invoices.reduce((sum, i) => sum + (Number(i.baseAmount) || 0), 0)
  const totalExcess = invoices.reduce((sum, i) => sum + (Number(i.excessAmount) || 0), 0)
  const totalShared = invoices.reduce((sum, i) => sum + (Number(i.sharedAmount) || 0), 0)
  const totalBilledRevenue = totalBase + totalExcess + totalShared

  const paidCount = invoices.filter((i) => i.status === 'PAID').length
  const unpaidCount = invoices.filter((i) => i.status !== 'PAID').length
  const totalInvoicesCount = invoices.length || 1
  const paidPercent = Math.round((paidCount / totalInvoicesCount) * 100)
  const unpaidPercent = 100 - paidPercent

  // Group usage by date for line graph
  const usageByDate = usageLogs.reduce((acc, log) => {
    const d = formatDate(log.readingDate)
    acc[d] = (acc[d] || 0) + Number(log.meterReadingKl)
    return acc
  }, {})

  const dateLabels = Object.keys(usageByDate).slice(0, 10).reverse()
  const dateValues = dateLabels.map((d) => usageByDate[d] || 0)
  const maxConsumption = Math.max(...dateValues, 10)

  // Group procurement by source
  const tankerVolume = procurements.filter((p) => (p.source || '').toLowerCase().includes('tanker')).reduce((sum, p) => sum + Number(p.volumeKl || 0), 0)
  const municipalVolume = procurements.filter((p) => (p.source || '').toLowerCase().includes('municipal')).reduce((sum, p) => sum + Number(p.volumeKl || 0), 0)
  const totalVolume = tankerVolume + municipalVolume || 1

  // Flat consumption ranking
  const flatUsageMap = usageLogs.reduce((acc, log) => {
    const flat = log.flatNumber || `Flat ${log.householdId}`
    acc[flat] = (acc[flat] || 0) + Number(log.meterReadingKl)
    return acc
  }, {})
  const topFlats = Object.entries(flatUsageMap)
    .map(([flat, vol]) => ({ flat, vol }))
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 5)

  const maxFlatVol = Math.max(...topFlats.map((f) => f.vol), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-sky-600" /> Apartment Reports & Executive Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Comprehensive water usage trends, procurement audits, revenue breakdowns, and visual charts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            title="Refresh Charts Data"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <FileSpreadsheet size={16} /> Export CSV Report
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block uppercase">Total Billed Revenue</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{formatCurrency(summary?.totalRevenue || totalBilledRevenue)}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">From itemized household bills</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block uppercase">Water Purchased</span>
          <span className="text-2xl font-extrabold text-sky-700 mt-1 block">{summary?.totalWaterPurchasedKl || 0} kL</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Municipal & Water Tankers</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block uppercase">Water Consumed</span>
          <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">{summary?.totalWaterConsumedKl || 0} kL</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Log meter readings sum</span>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 shadow-xs">
          <span className="text-xs font-bold text-teal-700 block uppercase">Collection Rate</span>
          <span className="text-2xl font-extrabold text-teal-900 mt-1 block">{paidPercent}%</span>
          <span className="text-[11px] text-teal-600 mt-1 block">{paidCount} Paid / {unpaidCount} Pending</span>
        </div>
      </div>

      {/* GRID OF VISUAL GRAPHS & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: Revenue Composition Stacked Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" /> Revenue Stream Composition
              </h3>
              <p className="text-xs text-slate-500">Breakdown of Base Rate vs Excess Tier vs Shared Procurement Costs</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Total: {formatCurrency(totalBilledRevenue)}
            </span>
          </div>

          {/* Multi-tier Stacked Bar */}
          <div className="space-y-3 pt-2">
            <div className="h-8 w-full overflow-hidden rounded-xl bg-slate-100 flex p-1 border border-slate-200">
              <div
                className="bg-sky-500 h-full rounded-l-lg transition-all duration-500 relative group"
                style={{ width: totalBilledRevenue ? `${(totalBase / totalBilledRevenue) * 100}%` : '40%' }}
                title={`Base Rate Charge: ${formatCurrency(totalBase)}`}
              />
              <div
                className="bg-indigo-600 h-full transition-all duration-500 relative group"
                style={{ width: totalBilledRevenue ? `${(totalExcess / totalBilledRevenue) * 100}%` : '35%' }}
                title={`Excess Rate Charge: ${formatCurrency(totalExcess)}`}
              />
              <div
                className="bg-amber-500 h-full rounded-r-lg transition-all duration-500 relative group"
                style={{ width: totalBilledRevenue ? `${(totalShared / totalBilledRevenue) * 100}%` : '25%' }}
                title={`Shared Tanker Cost: ${formatCurrency(totalShared)}`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="rounded-lg bg-sky-50 p-2.5 border border-sky-200">
                <span className="flex items-center gap-1.5 font-bold text-sky-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 inline-block"></span> Base Tier (₹15/kL)
                </span>
                <span className="text-slate-600 text-xs block mt-1 font-semibold">{formatCurrency(totalBase)}</span>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2.5 border border-indigo-200">
                <span className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 inline-block"></span> Excess Tier (₹25/kL)
                </span>
                <span className="text-slate-600 text-xs block mt-1 font-semibold">{formatCurrency(totalExcess)}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200">
                <span className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span> Shared Tanker
                </span>
                <span className="text-slate-600 text-xs block mt-1 font-semibold">{formatCurrency(totalShared)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 2: Payment Status Donut / Semi-Circle Gauge */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <PieChart size={18} className="text-indigo-600" /> Invoice Payment Distribution
              </h3>
              <p className="text-xs text-slate-500">Real-time status of paid invoices vs pending arrears</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              {invoices.length} Total Invoices
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-amber-100 stroke-current"
                  strokeWidth="3.8"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-600 stroke-current transition-all duration-1000"
                  strokeDasharray={`${paidPercent}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900">{paidPercent}%</span>
                <span className="text-[10px] font-bold uppercase text-teal-700">Paid Rate</span>
              </div>
            </div>

            {/* Side Legends */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-between gap-6 rounded-lg bg-teal-50 p-3 border border-teal-200">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-teal-600"></span>
                  <div>
                    <p className="text-xs font-bold text-teal-900">Paid Bills</p>
                    <p className="text-[11px] text-teal-700">{paidCount} Households</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-teal-900">{paidPercent}%</span>
              </div>

              <div className="flex items-center justify-between gap-6 rounded-lg bg-amber-50 p-3 border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                  <div>
                    <p className="text-xs font-bold text-amber-900">Pending Unpaid</p>
                    <p className="text-[11px] text-amber-700">{unpaidCount} Households</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-900">{unpaidPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 3: Water Procurement Source Volume Breakdown (Bar Chart) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <Truck size={18} className="text-sky-600" /> Procurement Source Volume (kL)
              </h3>
              <p className="text-xs text-slate-500">Comparison of Water Tankers vs Municipal Pipeline volume</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              {summary?.totalWaterPurchasedKl || 0} kL Total
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Tanker Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Private Water Tanker
                </span>
                <span className="text-slate-900">{tankerVolume} kL ({Math.round((tankerVolume / totalVolume) * 100)}%)</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((tankerVolume / totalVolume) * 100)}%` }}
                />
              </div>
            </div>

            {/* Municipal Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-600"></span> Municipal Supply
                </span>
                <span className="text-slate-900">{municipalVolume} kL ({Math.round((municipalVolume / totalVolume) * 100)}%)</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((municipalVolume / totalVolume) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 4: Top Consuming Households Ranking Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Top Consuming Households Ranking
              </h3>
              <p className="text-xs text-slate-500">Flats with highest logged water usage (kL)</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Metered Audit
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {topFlats.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No meter readings logged yet.</p>
            ) : (
              topFlats.map((item, idx) => (
                <div key={item.flat}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 font-mono">
                      #{idx + 1} {item.flat}
                    </span>
                    <span className="text-indigo-700 font-extrabold">{item.vol} kL</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((item.vol / maxFlatVol) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GRAPH 5: Meter Coverage & Unmetered Ratio */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
          <Activity size={18} className="text-teal-600" /> Apartment Metering Coverage & Fallback Ratio
        </h3>
        <div className="h-6 w-full overflow-hidden rounded-full bg-amber-100 flex p-0.5 border border-slate-200">
          <div
            className="bg-teal-600 h-full rounded-l-full transition-all duration-500"
            style={{ width: summary?.totalHouseholds ? `${(summary.meteredHouseholds / summary.totalHouseholds) * 100}%` : '100%' }}
          ></div>
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span className="text-teal-700 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600"></span> Metered Units: {summary?.meteredHouseholds || 0} units
          </span>
          <span className="text-amber-700 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Unmetered Area Fallback: {summary?.unmeteredHouseholds || 0} units
          </span>
        </div>
      </div>
    </div>
  )
}
