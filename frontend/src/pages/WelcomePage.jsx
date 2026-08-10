import { AlertTriangle, Archive, ArrowRight, CheckCircle2, IndianRupee, Droplets, Home, Info, Layers, LogOut, Plus, Play, RefreshCw, Search, Shield, Truck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

export default function WelcomePage({ title }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('smartwater.accessToken')

  const [user, setUser] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [auditMeta, setAuditMeta] = useState(null)
  const [tariffPlans, setTariffPlans] = useState([])
  const [cycles, setCycles] = useState([])
  const [households, setHouseholds] = useState([])
  const [purchases, setPurchases] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Search Flat Input
  const [searchFlatQuery, setSearchFlatQuery] = useState('')

  // Form toggles
  const [showTariffForm, setShowTariffForm] = useState(false)
  const [planName, setPlanName] = useState('Standard Tiered Rate')
  const [baseThreshold, setBaseThreshold] = useState('10')
  const [baseRate, setBaseRate] = useState('15')
  const [excessRate, setExcessRate] = useState('25')
  const [overuseThreshold, setOveruseThreshold] = useState('20')

  const [showProcurementForm, setShowProcurementForm] = useState(false)
  const [procurementSource, setProcurementSource] = useState('Water Tanker')
  const [procurementVolume, setProcurementVolume] = useState('15')
  const [procurementUnitCost, setProcurementUnitCost] = useState('20')

  const [showHouseholdForm, setShowHouseholdForm] = useState(false)
  const [flatNumber, setFlatNumber] = useState('B-201')
  const [flatSizeSqft, setFlatSizeSqft] = useState('1200')
  const [occupancyCount, setOccupancyCount] = useState('3')
  const [hasMeter, setHasMeter] = useState(true)

  const [showUsageForm, setShowUsageForm] = useState(false)
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0])
  const [meterReadingKl, setMeterReadingKl] = useState('14.5')

  const [cycleStartsOn, setCycleStartsOn] = useState('2026-01-01')
  const [cycleEndsOn, setCycleEndsOn] = useState('2026-01-31')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchData()
  }, [token])

  async function fetchData() {
    setLoading(true)
    setErrorMsg('')
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // User Profile
      const meRes = await fetch(`${apiBaseUrl}/api/users/me`, { headers })
      if (meRes.ok) setUser(await meRes.json())

      // Alerts
      const alertsRes = await fetch(`${apiBaseUrl}/api/alerts`, { headers })
      if (alertsRes.ok) setAlerts(await alertsRes.json())

      // Tariff Plans
      const plansRes = await fetch(`${apiBaseUrl}/api/apartments/1/tariff-plans`, { headers })
      if (plansRes.ok) setTariffPlans(await plansRes.json())

      // Households
      const hhRes = await fetch(`${apiBaseUrl}/api/apartments/1/households`, { headers })
      if (hhRes.ok) {
        const hhData = await hhRes.json()
        setHouseholds(hhData)
        if (hhData.length > 0) {
          setSelectedHouseholdId(hhData[0].id.toString())
        }
      }

      // Billing Cycles
      const cyclesRes = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, { headers })
      if (cyclesRes.ok) {
        const cList = await cyclesRes.json()
        setCycles(cList)
        if (cList.length > 0) {
          const activeCycleId = cList[0].id
          const pRes = await fetch(`${apiBaseUrl}/api/billing-cycles/${activeCycleId}/purchases`, { headers })
          if (pRes.ok) setPurchases(await pRes.json())
          const invRes = await fetch(`${apiBaseUrl}/api/billing-cycles/${activeCycleId}/invoices`, { headers })
          if (invRes.ok) setInvoices(await invRes.json())
        }
      }
    } catch {
      setErrorMsg("Failed to connect to backend server. Make sure Spring Boot is running on port 8082.")
    } finally {
      setLoading(false)
    }
  }

  // Create Tariff Plan
  async function handleCreateTariffPlan(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/tariff-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: planName,
          baseThresholdKl: parseFloat(baseThreshold),
          baseRate: parseFloat(baseRate),
          excessRate: parseFloat(excessRate),
          overuseThresholdKl: parseFloat(overuseThreshold),
          active: true,
        }),
      })
      if (r.ok) {
        setActionMsg('Tariff Plan created successfully!')
        setShowTariffForm(false)
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to create tariff plan.')
      }
    } catch {
      setErrorMsg('Error creating tariff plan.')
    }
  }

  // Create Billing Cycle
  async function handleCreateCycle(e) {
    e.preventDefault()
    if (tariffPlans.length === 0) return setErrorMsg('Create a Tariff Plan first!')
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tariffPlanId: tariffPlans[0].id,
          startsOn: cycleStartsOn,
          endsOn: cycleEndsOn,
        }),
      })
      if (r.ok) {
        setActionMsg('New Open Billing Cycle created successfully!')
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to create cycle.')
      }
    } catch {
      setErrorMsg('Failed to create billing cycle.')
    }
  }

  // Add Bulk Procurement
  async function handleAddProcurement(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')
    try {
      let activeCycleId = cycles.length > 0 ? cycles[0].id : null
      let activeCycleStatus = cycles.length > 0 ? cycles[0].status : null

      // If no cycle or active cycle is not OPEN, create an OPEN cycle automatically
      if (!activeCycleId || activeCycleStatus !== 'OPEN') {
        if (tariffPlans.length === 0) {
          // Auto create a default Tariff Plan if none exists
          const tpRes = await fetch(`${apiBaseUrl}/api/apartments/1/tariff-plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              name: 'Standard Tiered Rate',
              baseThresholdKl: 10,
              baseRate: 15,
              excessRate: 25,
              overuseThresholdKl: 20,
              active: true,
            }),
          })
          if (tpRes.ok) {
            const tpData = await tpRes.json()
            tariffPlans.push(tpData)
          }
        }

        const planId = tariffPlans.length > 0 ? tariffPlans[0].id : 1
        const cRes = await fetch(`${apiBaseUrl}/api/apartments/1/billing-cycles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            tariffPlanId: planId,
            startsOn: '2026-01-01',
            endsOn: '2026-01-31',
          }),
        })
        if (cRes.ok) {
          const newCycle = await cRes.json()
          activeCycleId = newCycle.id
        }
      }

      if (!activeCycleId) return setErrorMsg('Create an Open Billing Cycle first!')

      const r = await fetch(`${apiBaseUrl}/api/billing-cycles/${activeCycleId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          source: procurementSource,
          purchasedOn: new Date().toISOString().split('T')[0],
          volumeKl: parseFloat(procurementVolume),
          unitCost: parseFloat(procurementUnitCost),
          notes: 'Bulk tanker procurement',
        }),
      })
      if (r.ok) {
        setActionMsg(`Bulk Water Procurement of ${procurementVolume} kL ($${(parseFloat(procurementVolume) * parseFloat(procurementUnitCost)).toFixed(2)}) recorded!`)
        setShowProcurementForm(false)
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to record procurement.')
      }
    } catch {
      setErrorMsg('Failed to record procurement.')
    }
  }

  // Create Household
  async function handleCreateHousehold(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/apartments/1/households`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          flatNumber: flatNumber.trim(),
          flatSizeSqft: parseInt(flatSizeSqft),
          occupancyCount: parseInt(occupancyCount),
          hasMeter: hasMeter,
        }),
      })
      if (r.ok) {
        setActionMsg(`Household Flat ${flatNumber} created (${hasMeter ? 'Metered' : 'Unmetered'})!`)
        setShowHouseholdForm(false)
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to create household.')
      }
    } catch {
      setErrorMsg('Error creating household.')
    }
  }

  // Log Meter Reading
  async function handleLogUsage(e) {
    e.preventDefault()
    if (!selectedHouseholdId) return setErrorMsg('Select a household!')
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/households/${selectedHouseholdId}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          readingDate: readingDate,
          meterReadingKl: parseFloat(meterReadingKl),
        }),
      })
      if (r.ok) {
        setActionMsg(`Meter reading of ${meterReadingKl} kL logged successfully!`)
        setShowUsageForm(false)
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to log usage. Make sure flat has a meter.')
      }
    } catch {
      setErrorMsg('Error logging meter reading.')
    }
  }

  // Finalize Cycle
  async function handleFinalizeCycle() {
    if (cycles.length === 0) return setErrorMsg('No billing cycle found!')
    setActionMsg('')
    setErrorMsg('')
    try {
      const cycleId = cycles[0].id
      const r = await fetch(`${apiBaseUrl}/api/billing-cycles/${cycleId}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const invs = await r.json()
        setInvoices(invs)
        setActionMsg(`Billing Cycle finalized! Generated ${invs.length} itemized invoices.`)
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to finalize cycle.')
      }
    } catch {
      setErrorMsg('Failed to finalize cycle.')
    }
  }

  // Archive Cycle
  async function handleArchiveCycle() {
    if (cycles.length === 0) return setErrorMsg('No billing cycle found!')
    setActionMsg('')
    setErrorMsg('')
    try {
      const cycleId = cycles[0].id
      const r = await fetch(`${apiBaseUrl}/api/billing-cycles/${cycleId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        setActionMsg('Billing cycle archived!')
        fetchData()
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to archive cycle.')
      }
    } catch {
      setErrorMsg('Failed to archive cycle.')
    }
  }

  // Trigger Alert Audit
  async function handleRunAlertAudit() {
    setActionMsg('')
    setErrorMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/alerts/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        const res = await r.json()
        setAuditMeta(res)
        setAlerts(res.alerts)
        setActionMsg(`Alert audit completed! Evaluated ${res.householdsEvaluated} households, detected ${res.alertsTriggered} total alerts.`)
      } else {
        const b = await r.json().catch(() => null)
        setErrorMsg(b?.message || 'Failed to run alert evaluation.')
      }
    } catch {
      setErrorMsg('Failed to run alert evaluation.')
    }
  }

  function logout() {
    localStorage.removeItem('smartwater.accessToken')
    localStorage.removeItem('smartwater.refreshToken')
    navigate('/login')
  }

  const isResident = user?.role === 'RESIDENT'
  const activeCycle = cycles.length > 0 ? cycles[0] : null
  const residentHouseholdId = user?.householdId || 1001

  // Search & Filter Household Meter Lookup
  const searchedHousehold = searchFlatQuery.trim()
    ? households.find((h) => h.flatNumber.toLowerCase().includes(searchFlatQuery.trim().toLowerCase()))
    : null

  const searchedInvoice = searchedHousehold
    ? invoices.find((inv) => inv.householdId === searchedHousehold.id)
    : null

  const searchedAlerts = searchedHousehold
    ? alerts.filter((alt) => alt.householdId === searchedHousehold.id)
    : []

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
              <Droplets size={20} />
            </div>
            <div>
              <span className="font-display font-semibold tracking-tight text-slate-900 sm:text-lg">
                Smart Water Portal
              </span>
              <span className="ml-2.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header Title & Cycle Lifecycle Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isResident
                ? 'Welcome to your Resident Dashboard — View your itemized water bill & consumption breakdown.'
                : 'Weeks 3–4 Full Interactive Management: Tariff Config, Procurement, Households, Billing Lifecycle & Leak Audits'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCreateCycle}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 cursor-pointer"
            >
              <Plus size={16} /> Create Open Cycle
            </button>

            <button
              onClick={handleFinalizeCycle}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 cursor-pointer"
            >
              <CheckCircle2 size={16} /> Finalize Billing Cycle
            </button>

            <button
              onClick={handleArchiveCycle}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 cursor-pointer"
            >
              <Archive size={16} /> Archive Cycle
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 shadow-sm flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
            {actionMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900 shadow-sm flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* 🔍 DIRECT FLAT & WATER METER INSPECTOR */}
        <section className="mb-8 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 text-lg">
                <Search size={20} className="text-indigo-600" />
                Direct Flat & Water Meter Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Type any Flat Number (e.g. 1001, A-101, B-201) to instantly inspect its meter status, usage, and invoice!
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchFlatQuery}
                onChange={(e) => setSearchFlatQuery(e.target.value)}
                placeholder="Enter Flat Number (e.g. 1001)..."
                className="w-full rounded-lg border border-indigo-300 bg-white px-3.5 py-2 pl-9 text-sm shadow-2xs focus:border-indigo-500 focus:outline-none"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-indigo-400" />
            </div>
          </div>

          {searchFlatQuery.trim() && (
            <div className="mt-4">
              {searchedHousehold ? (
                <div className="rounded-lg bg-white p-5 border border-indigo-100 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase">Selected Flat Details</span>
                      <h4 className="font-display text-xl font-bold text-slate-900">Flat #{searchedHousehold.flatNumber}</h4>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        searchedHousehold.hasMeter ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {searchedHousehold.hasMeter ? 'Metered Flat' : 'Unmetered (Area Fallback)'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4 text-sm">
                    <div className="rounded bg-slate-50 p-3">
                      <span className="text-xs text-slate-500 block">Flat Size</span>
                      <span className="font-bold text-slate-900">{searchedHousehold.flatSizeSqft} SqFt</span>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <span className="text-xs text-slate-500 block">Occupants</span>
                      <span className="font-bold text-slate-900">{searchedHousehold.occupancyCount} People</span>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <span className="text-xs text-slate-500 block">Metered Volume</span>
                      <span className="font-bold text-sky-700">{searchedInvoice ? `${searchedInvoice.consumptionKl} kL` : '0 kL'}</span>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <span className="text-xs text-slate-500 block">Current Bill</span>
                      <span className="font-bold text-indigo-700">{searchedInvoice ? `$${searchedInvoice.totalAmount}` : '?0.00'}</span>
                    </div>
                  </div>

                  {searchedAlerts.length > 0 && (
                    <div className="rounded bg-red-50 p-3 border border-red-100 text-xs text-red-900">
                      <span className="font-bold">🚨 Active Alerts for Flat #{searchedHousehold.flatNumber}:</span>
                      <ul className="mt-1 list-disc list-inside">
                        {searchedAlerts.map((alt) => (
                          <li key={alt.id}>{alt.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-white p-4 text-center text-sm text-slate-500">
                  No flat found matching "{searchFlatQuery}". Try searching <b>1001</b>, <b>A-101</b>, or <b>B-201</b>.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Cycle Lifecycle Status Indicator */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-900">Current Billing Cycle Lifecycle State</h3>
                <p className="text-xs text-slate-500">
                  {activeCycle ? `Period: ${activeCycle.startsOn} to ${activeCycle.endsOn}` : 'No active cycle created yet. Click "Create Open Cycle" above.'}
                </p>
              </div>
            </div>
            {activeCycle && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Status:</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    activeCycle.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeCycle.status === 'FINALIZED'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {activeCycle.status}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Plain-English Cost Distribution Algorithm Walkthrough Box */}
        <section className="mb-8 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-teal-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
            <Info size={22} className="text-sky-600" />
            Plain-English Guide: How Water Charges & Bulk Procurement Costs Are Split
          </div>
          <div className="mt-3 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
            <div className="rounded-lg border border-sky-100 bg-white p-4 shadow-2xs">
              <h4 className="font-semibold text-sky-900">1. Metered Households (Actual Consumption)</h4>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-600">
                <li>• <b>Base Tier:</b> First 10 kL charged at <b>Base Rate (?15/kL)</b>.</li>
                <li>• <b>Excess Tier:</b> Usage beyond 10 kL charged at <b>Excess Rate (?25/kL)</b>.</li>
                <li>• <b>Shared Procurement Split:</b> Bulk tanker costs are split proportionally by consumption ratio:</li>
                <li className="font-mono text-[11px] text-sky-800 bg-sky-50 p-1 rounded mt-1">
                  Shared Cost = Procurement Cost × (Flat Usage / Total Metered Usage)
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-teal-100 bg-white p-4 shadow-2xs">
              <h4 className="font-semibold text-teal-900">2. Unmetered Households (Flat-Area Fallback)</h4>
              <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-600">
                <li>• <b>Base & Excess:</b> ?0 (no metered reading logged).</li>
                <li>• <b>Flat-Area Fallback:</b> Procurement/shared cost is split proportionally by square-footage ratio:</li>
                <li className="font-mono text-[11px] text-teal-800 bg-teal-50 p-1 rounded mt-1">
                  Shared Cost = Procurement Cost × (Flat SqFt / Total Unmetered SqFt)
                </li>
                <li>• Allows testing unmetered flats alongside metered flats!</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 1. Tariff Plan Creation & Display */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                <IndianRupee size={20} className="text-sky-600" />
                1. Tiered Tariff Rate Configuration
              </h2>
              <p className="text-xs text-slate-500">Configured rate tiers for base, excess, and overuse limits.</p>
            </div>
            <button
              onClick={() => setShowTariffForm(!showTariffForm)}
              className="flex items-center gap-1.5 rounded-lg border border-sky-600 bg-sky-50 text-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-100 cursor-pointer"
            >
              <Plus size={14} /> {showTariffForm ? 'Cancel Form' : '+ Add Tariff Plan'}
            </button>
          </div>

          {showTariffForm && (
            <form onSubmit={handleCreateTariffPlan} className="mt-4 rounded-lg bg-sky-50/80 p-4 border border-sky-200 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Plan Name</label>
                  <input
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Base Threshold (kL)</label>
                  <input
                    type="number"
                    value={baseThreshold}
                    onChange={(e) => setBaseThreshold(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Base Rate (?/kL)</label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Excess Rate (?/kL)</label>
                  <input
                    type="number"
                    value={excessRate}
                    onChange={(e) => setExcessRate(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Overuse Threshold (kL)</label>
                  <input
                    type="number"
                    value={overuseThreshold}
                    onChange={(e) => setOveruseThreshold(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
              >
                Save & Activate Tariff Plan
              </button>
            </form>
          )}

          {tariffPlans.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg bg-sky-50/70 p-3.5 border border-sky-100 text-sm">
                <span className="text-xs text-slate-500 block">Plan Name</span>
                <span className="font-bold text-slate-900">{tariffPlans[0].name}</span>
              </div>
              <div className="rounded-lg bg-sky-50/70 p-3.5 border border-sky-100 text-sm">
                <span className="text-xs text-slate-500 block">Base Tier (First 10 kL)</span>
                <span className="font-bold text-sky-800">${tariffPlans[0].baseRate} / kL</span>
              </div>
              <div className="rounded-lg bg-amber-50/70 p-3.5 border border-amber-100 text-sm">
                <span className="text-xs text-slate-500 block">Excess Tier (&gt; 10 kL)</span>
                <span className="font-bold text-amber-800">${tariffPlans[0].excessRate} / kL</span>
              </div>
              <div className="rounded-lg bg-teal-50/70 p-3.5 border border-teal-100 text-sm">
                <span className="text-xs text-slate-500 block">Overuse Alert Threshold</span>
                <span className="font-bold text-teal-800">{tariffPlans[0].overuseThresholdKl} kL</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
              No active tariff plan found. Click <b>"+ Add Tariff Plan"</b> above to create one.
            </div>
          )}
        </section>

        {/* 2. Bulk Procurement Tracker & Visible History Table */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Truck size={20} className="text-teal-600" />
                2. Bulk Water Procurement Records
              </h2>
              <p className="text-xs text-slate-500">Tanker deliveries & municipal procurement history.</p>
            </div>
            <button
              onClick={() => setShowProcurementForm(!showProcurementForm)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-50 text-teal-700 px-3 py-1.5 text-xs font-semibold hover:bg-teal-100 cursor-pointer"
            >
              <Plus size={14} /> {showProcurementForm ? 'Cancel Form' : '+ Record Procurement'}
            </button>
          </div>

          {showProcurementForm && (
            <form onSubmit={handleAddProcurement} className="mt-4 rounded-lg bg-teal-50/80 p-4 border border-teal-200 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Source</label>
                  <input
                    value={procurementSource}
                    onChange={(e) => setProcurementSource(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Volume (kL)</label>
                  <input
                    type="number"
                    value={procurementVolume}
                    onChange={(e) => setProcurementVolume(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Unit Cost (?/kL)</label>
                  <input
                    type="number"
                    value={procurementUnitCost}
                    onChange={(e) => setProcurementUnitCost(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer"
              >
                Submit Procurement Record
              </button>
            </form>
          )}

          {purchases.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Procurement Source</th>
                    <th className="px-4 py-2.5">Volume (kL)</th>
                    <th className="px-4 py-2.5">Unit Cost (?/kL)</th>
                    <th className="px-4 py-2.5 font-bold text-slate-900">Total Procurement Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5">{p.purchasedOn}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{p.source}</td>
                      <td className="px-4 py-2.5">{p.volumeKl} kL</td>
                      <td className="px-4 py-2.5">${p.unitCost}</td>
                      <td className="px-4 py-2.5 font-bold text-teal-700">${(p.volumeKl * p.unitCost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
              No bulk procurement records logged for this cycle yet. Click <b>"+ Record Procurement"</b> above.
            </div>
          )}
        </section>

        {/* 3. Household & Meter Reading Management */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Home size={20} className="text-indigo-600" />
                3. Household & Meter Reading Management
              </h2>
              <p className="text-xs text-slate-500">
                Create households (metered or unmetered) and log daily consumption readings.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHouseholdForm(!showHouseholdForm)}
                className="flex items-center gap-1 rounded-lg border border-indigo-600 bg-indigo-50 text-indigo-700 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
              >
                <Plus size={14} /> {showHouseholdForm ? 'Cancel' : '+ Add Flat'}
              </button>
              <button
                onClick={() => setShowUsageForm(!showUsageForm)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
              >
                <Plus size={14} /> {showUsageForm ? 'Cancel' : '+ Log Meter Reading'}
              </button>
            </div>
          </div>

          {/* Form: Add Flat */}
          {showHouseholdForm && (
            <form onSubmit={handleCreateHousehold} className="mt-4 rounded-lg bg-indigo-50/60 p-4 border border-indigo-100 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">Flat Number</label>
                  <input
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Flat Size (SqFt)</label>
                  <input
                    type="number"
                    value={flatSizeSqft}
                    onChange={(e) => setFlatSizeSqft(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Occupants</label>
                  <input
                    type="number"
                    value={occupancyCount}
                    onChange={(e) => setOccupancyCount(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="hasMeter"
                    checked={hasMeter}
                    onChange={(e) => setHasMeter(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 cursor-pointer"
                  />
                  <label htmlFor="hasMeter" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Has Water Meter
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Save Household
              </button>
            </form>
          )}

          {/* Form: Log Meter Reading */}
          {showUsageForm && (
            <form onSubmit={handleLogUsage} className="mt-4 rounded-lg bg-indigo-50/60 p-4 border border-indigo-100 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Select Flat</label>
                  <select
                    value={selectedHouseholdId}
                    onChange={(e) => setSelectedHouseholdId(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                  >
                    {households
                      .filter((h) => h.hasMeter)
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          Flat {h.flatNumber} (Metered)
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Reading Date</label>
                  <input
                    type="date"
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Meter Reading (kL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={meterReadingKl}
                    onChange={(e) => setMeterReadingKl(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Submit Daily Reading
              </button>
            </form>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {households.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm"
              >
                <div>
                  <span className="font-bold text-slate-900">Flat #{h.flatNumber}</span>
                  <span className="text-xs text-slate-500 block">
                    {h.flatSizeSqft} SqFt • {h.occupancyCount} Occupants
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    h.hasMeter ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {h.hasMeter ? 'Metered' : 'Unmetered (Area Fallback)'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Alert Engine Audit & Trigger Panel */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                4. Automated Alert Engine (Leak Spikes & Overuse Breaches)
              </h2>
              <p className="text-xs text-slate-500">
                Spring @Scheduled background worker evaluates threshold breaches and 2σ statistical leak spikes.
              </p>
            </div>
            <button
              onClick={handleRunAlertAudit}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer shadow-sm"
            >
              <Play size={14} /> Run Leak & Overuse Audit Now
            </button>
          </div>

          {auditMeta && (
            <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 font-medium border border-amber-100">
              <span>Last Audit: {new Date(auditMeta.lastEvaluatedAt).toLocaleTimeString()}</span>
              <span>• Evaluated: {auditMeta.householdsEvaluated} households</span>
              <span>• Total Alerts Triggered: {auditMeta.alertsTriggered}</span>
            </div>
          )}

          {alerts.length === 0 ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
              No leak spikes or overuse breaches detected. Click <b>"Run Leak & Overuse Audit Now"</b> to execute audit.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
                    alt.type === 'LEAK_SPIKE'
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">{alt.type}: </span>
                    <span>{alt.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Itemized Invoices Table */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                5. Itemized Household Invoices (Tiered + Shared Cost Allocation)
              </h2>
              <p className="text-xs text-slate-500">
                Detailed cost breakdown per household: Base Charge, Excess Tier Charge, and Shared Tanker Distribution.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {invoices.length} Invoices
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No finalized invoices generated yet. Click <b>"Finalize Billing Cycle"</b> at the top of the page.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">Flat #{inv.householdId}</td>
                      <td className="px-4 py-3">{inv.consumptionKl} kL</td>
                      <td className="px-4 py-3 text-sky-700">${inv.baseAmount}</td>
                      <td className="px-4 py-3 text-amber-700">${inv.excessAmount}</td>
                      <td className="px-4 py-3 text-teal-700">${inv.sharedAmount}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">${inv.totalAmount}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
