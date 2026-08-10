import { Activity, AlertTriangle, Award, Bell, CheckCircle2, CreditCard, Download, Droplets, Edit, FileText, Globe, Home, Lightbulb, LogOut, MessageSquare, Save, Send, TrendingDown, User, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PaymentGatewayModal from '../components/PaymentGatewayModal'
import { formatCurrency, formatDate } from '../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

export default function ResidentDashboardPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('smartwater.accessToken')

  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [household, setHousehold] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [benchmark, setBenchmark] = useState(null)
  const [myUsageLogs, setMyUsageLogs] = useState([])
  const [sentMessages, setSentMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Payment Modal State
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null)

  // Form inputs for Name and Flat Number
  const [residentNameInput, setResidentNameInput] = useState('')
  const [flatNumberInput, setFlatNumberInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Resident Message Form
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const waterSavingTips = [
    { id: 1, title: 'Fix Silent Toilet Leaks', savings: 'Up to 200 L/day', desc: 'A worn flapper in your toilet tank can waste thousands of liters monthly without sound.' },
    { id: 2, title: 'Install Tap Aerators', savings: '40% Water Savings', desc: 'Low-cost faucet aerators mix air into water stream maintaining high pressure with less flow.' },
    { id: 3, title: 'Bucket Bathing vs Shower', savings: '50 L per bath', desc: 'A 10-minute shower uses 100+ liters of water, while a standard bucket uses only 20 liters.' },
    { id: 4, title: 'Full Loads Only in Washing Machine', savings: '40 L per cycle', desc: 'Always wait for a full load of laundry to maximize water and energy efficiency.' },
  ]

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setErrorMsg('')
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // 1. Current user
      const userRes = await fetch(`${apiBaseUrl}/api/users/me`, { headers })
      if (!userRes.ok) {
        localStorage.removeItem('smartwater.accessToken')
        navigate('/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData)
      setResidentNameInput(userData.name || '')
      setFlatNumberInput(userData.flatNumber || '')

      const hId = userData.householdId

      // 2. Fetch Household
      if (hId) {
        const hRes = await fetch(`${apiBaseUrl}/api/households/${hId}`, { headers })
        if (hRes.ok) setHousehold(await hRes.json())
      }

      // 3. Fetch Invoices & Filter by Resident Flat
      const invRes = await fetch(`${apiBaseUrl}/api/billing-cycles/invoices`, { headers })
      if (invRes.ok) {
        const allInvoices = await invRes.json()
        const myInvoices = allInvoices
          .filter((i) => (hId ? i.householdId === hId : i.flatNumber === userData.flatNumber))
          .sort((a, b) => b.id - a.id)
        setInvoices(myInvoices)
      }

      // 4. Fetch Alerts & Filter by Resident Flat or Broadcast
      const altRes = await fetch(`${apiBaseUrl}/api/alerts`, { headers })
      if (altRes.ok) {
        const allAlerts = await altRes.json()
        const myAlerts = allAlerts
          .filter((a) => !a.householdId || (hId && a.householdId === hId) || a.flatNumber === userData.flatNumber || a.flatNumber === 'ALL')
          .sort((a, b) => b.id - a.id)
        setAlerts(myAlerts)
      }

      // 5. Fetch Benchmark
      if (hId) {
        const bmRes = await fetch(`${apiBaseUrl}/api/households/${hId}/benchmark`, { headers })
        if (bmRes.ok) setBenchmark(await bmRes.json())
      }

      // 6. Fetch Usage Logs for Flat
      const usageRes = await fetch(`${apiBaseUrl}/api/households/usage`, { headers })
      if (usageRes.ok) {
        const allUsage = await usageRes.json()
        const myLogs = allUsage.filter((u) => (hId ? u.householdId === hId : u.flatNumber === userData.flatNumber))
        setMyUsageLogs(myLogs)
      }

      // 7. Fetch Sent Resident Messages
      const msgRes = await fetch(`${apiBaseUrl}/api/resident-messages/my`, { headers })
      if (msgRes.ok) {
        setSentMessages(await msgRes.json())
      }
    } catch {
      setErrorMsg('Failed to load resident dashboard data. Backend may be offline.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setActionMsg('')
    setErrorMsg('')

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      const r = await fetch(`${apiBaseUrl}/api/users/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: residentNameInput.trim(),
          flatNumber: flatNumberInput.trim().toUpperCase(),
        }),
      })

      if (r.ok) {
        const updated = await r.json()
        setUser(updated)
        setActionMsg('Profile & Flat Number successfully saved!')
        fetchData()
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Error updating profile.')
      }
    } catch {
      setErrorMsg('Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSendResidentMessage(e) {
    e.preventDefault()
    if (!msgBody.trim()) return
    setSendingMsg(true)
    setActionMsg('')
    setErrorMsg('')

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      const r = await fetch(`${apiBaseUrl}/api/resident-messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: msgSubject.trim() || 'General Enquiry',
          message: msgBody.trim(),
        }),
      })

      if (r.ok) {
        setActionMsg('Message successfully sent to the Apartment Administrator!')
        setMsgSubject('')
        setMsgBody('')
        fetchData()
      } else {
        setErrorMsg('Failed to send message.')
      }
    } catch {
      setErrorMsg('Error sending message to server.')
    } finally {
      setSendingMsg(false)
    }
  }

  async function handleDownloadPdfInvoice(invoiceId) {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await fetch(`${apiBaseUrl}/api/invoices/${invoiceId}/pdf`, { headers })
      if (!res.ok) throw new Error('PDF download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SmartWater_Invoice_${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Could not download PDF invoice.')
    }
  }

  function handleLogout() {
    localStorage.removeItem('smartwater.accessToken')
    localStorage.removeItem('smartwater.refreshToken')
    navigate('/login')
  }

  const currentInvoice = invoices.length > 0 ? invoices[0] : null
  const currentInvoiceCode = currentInvoice ? (currentInvoice.invoiceCode ? `Id ${currentInvoice.invoiceCode}` : `Id ${currentInvoice.id}`) : null
  const displayResidentName = user?.name || null
  const displayFlatNumber = user?.flatNumber || household?.flatNumber || ''

  const hasMeterReadingsFromAdmin = myUsageLogs.length > 0

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Payment Gateway Modal */}
      {selectedInvoiceForPayment && (
        <PaymentGatewayModal
          invoice={selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-xs">
              <Droplets size={20} />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-slate-900 leading-tight">SmartWater</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Resident Portal</span>
            </div>
          </div>

          {/* SIDEBAR NAVIGATION */}
          <nav className="space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home size={16} /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'profile' ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={16} /> My Profile & Flat Box
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'benchmark' ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users size={16} /> Peer Benchmarking
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'tips' ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Lightbulb size={16} /> Water Saving Tips
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'invoices' ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={16} /> My Invoices
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'alerts' ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle size={16} /> My Alerts & Messages
            </button>
          </nav>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-600 font-bold text-white text-xs">
              {displayResidentName ? displayResidentName.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {displayResidentName || 'Welcome Resident!'}
              </span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                {displayFlatNumber ? `Flat ${displayFlatNumber}` : 'Flat Not Set'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <Globe size={14} /> Go to Home Page
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
              {displayResidentName ? (
                <>
                  Welcome, {displayResidentName}!
                  {displayFlatNumber && (
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                      Flat {displayFlatNumber}
                    </span>
                  )}
                </>
              ) : (
                'Welcome!'
              )}
            </h1>
            <p className="text-xs text-slate-500">
              View real-time leak spike warnings, overuse anomaly alerts, pay water bills, and communicate with Admin.
            </p>
          </div>

          {currentInvoice && (
            <div className="flex items-center gap-2">
              {currentInvoice.status !== 'PAID' && (
                <button
                  onClick={() => setSelectedInvoiceForPayment(currentInvoice)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <CreditCard size={15} /> Pay Bill Now ({formatCurrency(currentInvoice.totalAmount)})
                </button>
              )}

              <button
                onClick={() => handleDownloadPdfInvoice(currentInvoice.id)}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-colors cursor-pointer"
              >
                <Download size={15} /> Download PDF Invoice ({currentInvoiceCode})
              </button>
            </div>
          )}
        </div>

        {/* FEEDBACK MESSAGES */}
        {actionMsg && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
            {actionMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* 1. DASHBOARD OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Bill Card */}
            {currentInvoice && hasMeterReadingsFromAdmin ? (
              <section className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-sky-50 p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
                      Flat {displayFlatNumber} • Current Water Bill ({currentInvoiceCode})
                    </span>
                    <h2 className="font-display text-3xl font-extrabold text-slate-900 mt-1">
                      Total Bill: {formatCurrency(currentInvoice.totalAmount)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentInvoice.status === 'PAID' ? (
                      <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                        Status: PAID
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedInvoiceForPayment(currentInvoice)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <CreditCard size={14} /> Pay Bill Now
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPdfInvoice(currentInvoice.id)}
                      className="flex items-center gap-1 rounded-lg bg-white border border-teal-300 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <Download size={14} /> PDF
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4 text-sm">
                  <div className="rounded-lg bg-white p-3.5 border border-teal-100">
                    <span className="text-xs text-slate-500 block">Metered Volume</span>
                    <span className="font-bold text-slate-900">{currentInvoice.consumptionKl} kL</span>
                  </div>
                  <div className="rounded-lg bg-white p-3.5 border border-teal-100">
                    <span className="text-xs text-slate-500 block">Base Tier Charge (₹15/kL)</span>
                    <span className="font-bold text-sky-700">{formatCurrency(currentInvoice.baseAmount)}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3.5 border border-teal-100">
                    <span className="text-xs text-slate-500 block">Excess Tier Charge (₹25/kL)</span>
                    <span className="font-bold text-amber-700">{formatCurrency(currentInvoice.excessAmount)}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3.5 border border-teal-100">
                    <span className="text-xs text-slate-500 block">Shared Tanker Cost</span>
                    <span className="font-bold text-teal-700">{formatCurrency(currentInvoice.sharedAmount)}</span>
                  </div>
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center space-y-2">
                <AlertTriangle className="mx-auto text-amber-600" size={28} />
                <h4 className="font-bold text-amber-900 text-base">
                  No Meter Readings Recorded by Admin for Flat {displayFlatNumber || 'Not Set'} Yet
                </h4>
                <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                  Once the Admin logs meter readings for <strong>Flat {displayFlatNumber || 'your flat'}</strong> and calculates the billing cycle, your itemized consumption details and monthly bill will appear here automatically.
                </p>
              </div>
            )}

            {/* RECHARTS DAILY/MONTHLY CONSUMPTION TREND LINE GRAPH */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={18} className="text-teal-600" /> Daily & Monthly Consumption Trends (Recharts)
                  </h3>
                  <p className="text-xs text-slate-500">Track your household water consumption history over time in kiloliters (kL).</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                  Flat {displayFlatNumber || 'A-101'}
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      myUsageLogs.length > 0
                        ? [...myUsageLogs].reverse().map((l) => ({ date: formatDate(l.readingDate), consumption: Number(l.meterReadingKl) || 0 }))
                        : [
                            { date: '01 Aug', consumption: 12.5 },
                            { date: '02 Aug', consumption: 14.0 },
                            { date: '03 Aug', consumption: 11.2 },
                            { date: '04 Aug', consumption: 15.8 },
                            { date: '05 Aug', consumption: 18.5 },
                            { date: '06 Aug', consumption: 14.2 },
                            { date: '07 Aug', consumption: 20.8 },
                          ]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kL" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="consumption" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} name="Consumption (kL)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {/* 2. PROFILE & FLAT BOX TAB */}
        {activeTab === 'profile' && (
          <section className="rounded-xl border border-teal-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User size={20} className="text-teal-600" /> Enter Resident Name & Flat Number
                </h3>
                <p className="text-xs text-slate-500">
                  Provide your full name and flat number to view your specific water consumption, bills, and peer benchmark.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  value={residentNameInput}
                  onChange={(e) => setResidentNameInput(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Flat / Household Number</label>
                <input
                  type="text"
                  required
                  value={flatNumberInput}
                  onChange={(e) => setFlatNumberInput(e.target.value)}
                  placeholder="e.g. A-101, B-201, D-301"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold uppercase focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 px-4 text-xs font-bold text-white shadow-xs hover:bg-teal-700 cursor-pointer disabled:opacity-70"
                >
                  <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile & Load Details'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 3. PEER BENCHMARKING TAB */}
        {activeTab === 'benchmark' && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-teal-600" /> Peer Water Benchmarking & Efficiency Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Compare Flat {displayFlatNumber || 'your flat'} consumption against apartment averages and similar sized households.
                </p>
              </div>
              {benchmark?.conservationBadge && (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                  {benchmark.conservationBadge}
                </span>
              )}
            </div>

            {benchmark ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-teal-50/60 p-4 border border-teal-100">
                    <span className="text-xs text-slate-500 block">Your Flat Consumption</span>
                    <span className="font-display text-2xl font-black text-teal-900">{benchmark.householdConsumptionKl} kL</span>
                  </div>
                  <div className="rounded-xl bg-sky-50/60 p-4 border border-sky-100">
                    <span className="text-xs text-slate-500 block">Apartment Average</span>
                    <span className="font-display text-2xl font-black text-sky-900">{benchmark.apartmentAverageKl} kL</span>
                  </div>
                  <div className="rounded-xl bg-amber-50/60 p-4 border border-amber-100">
                    <span className="text-xs text-slate-500 block">Similar Sized Flats Average</span>
                    <span className="font-display text-2xl font-black text-amber-900">{benchmark.similarSizedAverageKl} kL</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Water Saver Ranking in Apartment:</span>
                  <span className="font-mono text-sm font-extrabold text-teal-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    Rank #{benchmark.percentileRank}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                No benchmarking data calculated yet. Admin needs to log meter readings for Flat {displayFlatNumber || 'your flat'}.
              </div>
            )}
          </section>
        )}

        {/* 4. WATER SAVING TIPS TAB */}
        {activeTab === 'tips' && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-500" /> Water Conservation Tips & Best Practices
              </h3>
              <p className="text-xs text-slate-500">Actionable steps to reduce monthly water usage, save on excess tier charges, and earn badges.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {waterSavingTips.map((tip) => (
                <div key={tip.id} className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-orange-50/20 p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{tip.title}</h4>
                    <span className="rounded bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-extrabold border border-amber-200">
                      {tip.savings}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. INVOICES TAB WITH INTEGRATED PAYMENT GATEWAY */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {/* FEATURED CURRENT INVOICE & PAYMENT CARD */}
            {currentInvoice ? (
              <section className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 block">
                      Flat {displayFlatNumber} • Latest Water Invoice ({currentInvoiceCode})
                    </span>
                    <h2 className="font-display text-3xl font-black text-slate-900 mt-1">
                      Amount Due: {formatCurrency(currentInvoice.totalAmount)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    {currentInvoice.status === 'PAID' ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                          <CheckCircle2 size={15} /> CONFIRMED PAID
                        </span>
                        {currentInvoice.paymentMethod && (
                          <span className="text-[11px] text-slate-500 block mt-1 font-semibold">
                            Verified via {currentInvoice.paymentMethod} ({currentInvoice.transactionRef || 'TXN'})
                          </span>
                        )}
                      </div>
                    ) : currentInvoice.status === 'PENDING_VERIFICATION' ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-900 border border-amber-300">
                          Payment Submitted (Pending Admin Verification)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          {currentInvoice.paymentMethod} • Ref: {currentInvoice.transactionRef}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedInvoiceForPayment(currentInvoice)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-emerald-700 transition-all hover:scale-105 cursor-pointer"
                      >
                        <CreditCard size={18} /> Pay {formatCurrency(currentInvoice.totalAmount)} Now
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadPdfInvoice(currentInvoice.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-white border border-teal-300 px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-teal-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Download size={15} /> Download PDF
                    </button>
                  </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid gap-3 sm:grid-cols-4 text-xs">
                  <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-2xs">
                    <span className="text-slate-500 block mb-0.5">Metered Consumption</span>
                    <span className="font-bold text-slate-900 text-sm">{currentInvoice.consumptionKl} kL</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-2xs">
                    <span className="text-slate-500 block mb-0.5">Base Tier Charge</span>
                    <span className="font-bold text-sky-800 text-sm">{formatCurrency(currentInvoice.baseAmount)}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-2xs">
                    <span className="text-slate-500 block mb-0.5">Excess Tier Charge</span>
                    <span className="font-bold text-amber-800 text-sm">{formatCurrency(currentInvoice.excessAmount)}</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-2xs">
                    <span className="text-slate-500 block mb-0.5">Shared Tanker Share</span>
                    <span className="font-bold text-teal-800 text-sm">{formatCurrency(currentInvoice.sharedAmount)}</span>
                  </div>
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center space-y-2">
                <AlertTriangle className="mx-auto text-amber-600" size={28} />
                <h4 className="font-bold text-amber-900 text-base">No Invoices Available for Flat {displayFlatNumber || 'Not Set'}</h4>
                <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
                  Invoices are generated automatically after the Admin logs meter readings and finalizes the billing cycle.
                </p>
              </div>
            )}

            {/* CONFIRMED PAYMENTS & VERIFIED RECEIPTS SECTION */}
            {invoices.some((i) => i.status === 'PAID') && (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-600" /> Confirmed Payments & Verified Receipts
                    </h3>
                    <p className="text-xs text-slate-600">
                      Invoices marked as PAID by the Administrator or confirmed online with official transaction records.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                    {invoices.filter((i) => i.status === 'PAID').length} Confirmed Payment(s)
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {invoices
                    .filter((i) => i.status === 'PAID')
                    .map((inv) => {
                      const invCode = inv.invoiceCode ? `Id ${inv.invoiceCode}` : `Id ${inv.id}`
                      return (
                        <div key={inv.id} className="rounded-xl bg-white p-4 border border-emerald-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                              <span className="font-bold text-xs text-emerald-900 font-mono block">{invCode}</span>
                              <span className="text-[11px] text-slate-500 font-semibold">Flat {inv.flatNumber}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                              <CheckCircle2 size={12} /> CONFIRMED PAID
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Amount Paid:</span>
                            <span className="font-display font-extrabold text-emerald-700 text-base">{formatCurrency(inv.totalAmount)}</span>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] space-y-1 text-slate-600 border border-slate-100">
                            <div className="flex justify-between">
                              <span>Payment Method:</span>
                              <span className="font-bold text-slate-900">{inv.paymentMethod || 'ADMIN_VERIFIED'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transaction Ref:</span>
                              <span className="font-mono font-bold text-slate-900">{inv.transactionRef || 'ADM-CONFIRMED'}</span>
                            </div>
                            {inv.paidAt && (
                              <div className="flex justify-between">
                                <span>Confirmed Date:</span>
                                <span className="font-semibold text-slate-800">{formatDate(inv.paidAt)}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDownloadPdfInvoice(inv.id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-xs transition-colors cursor-pointer"
                          >
                            <Download size={14} /> Download Official Paid Receipt (PDF)
                          </button>
                        </div>
                      )
                    })}
                </div>
              </section>
            )}

            {/* INVOICES HISTORY TABLE */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-teal-600" /> Complete Invoice History & Payment Status
                  </h3>
                  <p className="text-xs text-slate-500">View all past monthly water statements and complete pending payments.</p>
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No invoice records found for Flat {displayFlatNumber || 'Not Set'}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Invoice Code</th>
                        <th className="px-4 py-3">Flat</th>
                        <th className="px-4 py-3">Metered Volume</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Payment Status</th>
                        <th className="px-4 py-3 text-right">Payment & Download Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {invoices.map((inv) => {
                        const code = inv.invoiceCode ? `id ${inv.invoiceCode}` : `id ${inv.id}`
                        const isPaid = inv.status === 'PAID'
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold font-mono text-teal-800">{code}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">Flat {inv.flatNumber}</td>
                            <td className="px-4 py-3">{inv.consumptionKl} kL</td>
                            <td className="px-4 py-3 font-extrabold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                            <td className="px-4 py-3">
                              {isPaid ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                  PAID
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                  UNPAID
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              {!isPaid && (
                                <button
                                  onClick={() => setSelectedInvoiceForPayment(inv)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                                >
                                  <CreditCard size={13} /> Pay Now
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadPdfInvoice(inv.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 cursor-pointer"
                              >
                                <Download size={13} /> PDF
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 6. ALERTS & DIRECT MESSAGES TAB WITH RESIDENT MESSAGE BOX */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* SEND MESSAGE TO ADMIN FORM BOX */}
            <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-6 shadow-xs space-y-4">
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-sky-600" /> Send Direct Message / Query to Apartment Admin
              </h3>
              <p className="text-xs text-slate-500">
                Have a question about your water meter reading, invoice, or maintenance request? Send a message directly to the Admin.
              </p>

              <form onSubmit={handleSendResidentMessage} className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject (e.g. Meter Reading Clarification for C-302)"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-600 focus:outline-none"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Write your detailed message to the Admin..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={14} /> {sendingMsg ? 'Sending...' : 'Send Message to Admin'}
                  </button>
                </div>
              </form>

              {/* Resident Sent Messages History */}
              {sentMessages.length > 0 && (
                <div className="pt-3 border-t border-sky-200/60 space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">Your Sent Messages History:</span>
                  <div className="space-y-2">
                    {sentMessages.map((m) => (
                      <div key={m.id} className="rounded-lg bg-white p-3.5 border border-sky-100 text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{m.subject}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'READ' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {m.status === 'READ' ? 'READ BY ADMIN' : 'DELIVERED TO ADMIN'}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ALERTS & ADMIN MESSAGES FEED */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-500" /> My Flat Leak Warnings & Admin Notices
              </h3>
              <p className="text-xs text-slate-500">Real-time leak anomaly alerts, threshold breach warnings, and notices broadcast by Admin.</p>

              {alerts.length === 0 ? (
                <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No leak warnings or direct admin notices reported for {displayFlatNumber ? `Flat ${displayFlatNumber}` : 'your flat'}.
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alt) => {
                    const altCode = `alt ${alt.id}`
                    const isDirectMessage = alt.type === 'DIRECT_MESSAGE' || alt.type === 'ADMIN_NOTICE'
                    const isLeak = alt.type === 'LEAK_SPIKE'

                    return (
                      <div
                        key={alt.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
                          isDirectMessage
                            ? 'border-sky-200 bg-sky-50 text-sky-900'
                            : isLeak
                            ? 'border-red-200 bg-red-50 text-red-900'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        {isDirectMessage ? (
                          <MessageSquare size={18} className="mt-0.5 shrink-0 text-sky-600" />
                        ) : (
                          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-xs">{altCode}: </span>
                            <span className="font-extrabold text-xs uppercase px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                              {alt.type}
                            </span>
                          </div>
                          <p className="mt-1 font-medium leading-relaxed">{alt.message}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
