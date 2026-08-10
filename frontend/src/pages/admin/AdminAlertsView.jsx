import { AlertTriangle, CheckCircle2, Inbox, MessageSquare, Play, Send, MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDate } from '../../utils/formatters'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

export default function AdminAlertsView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [alerts, setAlerts] = useState([])
  const [households, setHouseholds] = useState([])
  const [residentMessages, setResidentMessages] = useState([])
  const [actionMsg, setActionMsg] = useState('')

  // Form states for sending Direct Message to Resident
  const [targetFlat, setTargetFlat] = useState('ALL')
  const [category, setCategory] = useState('DIRECT_MESSAGE')
  const [customMessage, setCustomMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  useEffect(() => {
    fetchAlerts()
    fetchHouseholds()
    fetchResidentMessages()
  }, [])

  async function fetchAlerts() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/alerts`, { headers })
    if (r.ok) {
      const data = await r.json()
      data.sort((a, b) => b.id - a.id)
      setAlerts(data)
    }
  }

  async function fetchHouseholds() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/apartments/1/households`, { headers })
    if (r.ok) {
      setHouseholds(await r.json())
    }
  }

  async function fetchResidentMessages() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/resident-messages`, { headers })
    if (r.ok) {
      setResidentMessages(await r.json())
    }
  }

  async function handleMarkMessageRead(id) {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/resident-messages/${id}/read`, {
        method: 'PUT',
        headers,
      })
      if (r.ok) {
        setActionMsg('Resident message marked as READ.')
        fetchResidentMessages()
      }
    } catch {
      setActionMsg('Error updating message status.')
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
        const sorted = (res.alerts || []).sort((a, b) => b.id - a.id)
        setAlerts(sorted)
        setActionMsg(`Audit finished! Evaluated ${res.householdsEvaluated} households, detected ${res.alertsTriggered} total alerts.`)
      }
    } catch {
      setActionMsg('Error running audit.')
    }
  }

  async function handleSendMessage(e) {
    e?.preventDefault()
    if (!customMessage.trim()) return

    setSendingMsg(true)
    setActionMsg('')
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
      const res = await fetch(`${apiBaseUrl}/api/alerts/send-message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          flatNumber: targetFlat,
          category,
          message: customMessage.trim(),
        }),
      })

      if (res.ok) {
        setActionMsg(`Direct message successfully dispatched to ${targetFlat === 'ALL' ? 'All Households' : `Flat ${targetFlat}`}!`)
        setCustomMessage('')
        fetchAlerts()
      } else {
        setActionMsg('Failed to send message.')
      }
    } catch {
      setActionMsg('Error sending message to server.')
    } finally {
      setSendingMsg(false)
    }
  }

  async function handleResolve(a) {
    const altCode = `alt ${a.id}`
    try {
      const r = await fetch(`${apiBaseUrl}/api/alerts/${a.id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        setActionMsg(`Alert ${altCode} marked as resolved.`)
        fetchAlerts()
      }
    } catch {
      setActionMsg('Error resolving alert.')
    }
  }

  const activeAlertsCount = alerts.filter((a) => !a.resolved).length
  const unreadResidentMessagesCount = residentMessages.filter((m) => m.status === 'UNREAD').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={22} className="text-amber-500" /> Alerts, Direct Messaging & Resident Inbox
          </h2>
          <p className="text-xs text-slate-500">View real-time leak anomaly alerts, send notices to residents, and respond to incoming resident enquiries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAudit}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
          >
            <Play size={14} /> Run Leak Detection Audit
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* RESIDENT ENQUIRIES & MESSAGES INBOX */}
      <section className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/70 to-teal-50/30 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sky-200/60 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Inbox size={18} className="text-sky-600" /> Resident Enquiries & Messages Inbox
            </h3>
            <p className="text-xs text-slate-600">Messages sent by apartment residents regarding meter readings, bills, or queries.</p>
          </div>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-900 border border-sky-200">
            {unreadResidentMessagesCount} Unread Message{unreadResidentMessagesCount === 1 ? '' : 's'}
          </span>
        </div>

        {residentMessages.length === 0 ? (
          <div className="rounded-lg bg-white/80 p-4 text-center text-xs text-slate-500 font-medium">
            No incoming resident messages received yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-white border border-sky-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-50 text-[11px] font-bold uppercase text-sky-900 border-b border-sky-200/60">
                <tr>
                  <th className="px-4 py-3">Flat</th>
                  <th className="px-4 py-3">Resident Name</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Message Content</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 font-medium">
                {residentMessages.map((m) => (
                  <tr key={m.id} className="hover:bg-sky-50/30">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <span className="rounded bg-sky-100 text-sky-900 font-bold px-2 py-0.5 border border-sky-200">
                        Flat {m.flatNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{m.residentName}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{m.subject}</td>
                    <td className="px-4 py-3 text-slate-600 leading-relaxed max-w-md">{m.message}</td>
                    <td className="px-4 py-3">
                      {m.status === 'READ' ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">READ</span>
                      ) : (
                        <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-300">UNREAD</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.status !== 'READ' && (
                        <button
                          onClick={() => handleMarkMessageRead(m.id)}
                          className="inline-flex items-center gap-1 rounded bg-sky-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-sky-700 cursor-pointer"
                        >
                          <MailCheck size={13} /> Mark Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ADMIN DIRECT NOTICE SEND BOX */}
      <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-sky-600" /> Send Direct Notice / Message to Targeted Resident
            </h3>
            <p className="text-xs text-slate-500">
              Send a custom notice to a specific flat (e.g. Flat C-301) or broadcast to all households. It will immediately appear on the resident's "My Alerts & Messages" tab.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Household / Flat</label>
              <select
                value={targetFlat}
                onChange={(e) => setTargetFlat(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Households (Broadcast Notice)</option>
                {households.map((h) => (
                  <option key={h.id} value={h.flatNumber}>
                    Flat {h.flatNumber} ({h.occupancyCount} occupants)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notice Category / Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
              >
                <option value="DIRECT_MESSAGE">Direct Admin Message</option>
                <option value="LEAK_SPIKE">Leak / High Meter Anomaly Notice</option>
                <option value="OVERUSE">Water Overuse Warning</option>
                <option value="MAINTENANCE">Tank Maintenance / Supply Shutdown</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notice / Message Content</label>
            <textarea
              required
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Dear Resident, our automated meter reading detected abnormal flow in your line. Please check your internal taps and valves."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendingMsg}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send size={15} /> {sendingMsg ? 'Sending Message...' : 'Send Message to Targeted Resident'}
            </button>
          </div>
        </form>
      </section>

      {/* ALERTS TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Alert Code</th>
              <th className="px-4 py-3">Alert Type</th>
              <th className="px-4 py-3">Household Flat</th>
              <th className="px-4 py-3">Details & Message</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-xs text-slate-500">
                  No active alerts reported.
                </td>
              </tr>
            ) : (
              alerts.map((a) => {
                const altCode = `alt ${a.id}`
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold font-mono text-slate-900">{altCode}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold">{a.type}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.flatNumber ? `Flat ${a.flatNumber}` : 'All Flats'}</td>
                    <td className="px-4 py-3 text-xs leading-relaxed max-w-md">{a.message}</td>
                    <td className="px-4 py-3">
                      {a.resolved ? (
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">RESOLVED</span>
                      ) : (
                        <span className="rounded bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5">ACTIVE</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!a.resolved && (
                        <button
                          onClick={() => handleResolve(a)}
                          className="rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Resolve
                        </button>
                      )}
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
