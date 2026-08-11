import { UserCheck, UserX, CheckCircle2, Home, Plus, Search, Trash2, Users, ShieldAlert, UserPlus, KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://smart-water-usage-and-consumer-billing.onrender.com'

export default function AdminHouseholdsView() {
  const token = localStorage.getItem('smartwater.accessToken')
  const [households, setHouseholds] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showResidentForm, setShowResidentForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [myApartmentId, setMyApartmentId] = useState(null)

  const [flatNumber, setFlatNumber] = useState('C-301')
  const [flatSizeSqft, setFlatSizeSqft] = useState('1200')
  const [occupancyCount, setOccupancyCount] = useState('3')
  const [hasMeter, setHasMeter] = useState(true)

  const [residentName, setResidentName] = useState('')
  const [residentEmail, setResidentEmail] = useState('')
  const [residentPassword, setResidentPassword] = useState('')
  const [residentFlatNumber, setResidentFlatNumber] = useState('')
  const [residentOccupancy, setResidentOccupancy] = useState('3')
  const [residentFlatSize, setResidentFlatSize] = useState('1200')

  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { fetchMyApartmentId() }, [])

  useEffect(() => {
    if (!myApartmentId) return
    fetchHouseholds()
    fetchPendingUsers()
  }, [myApartmentId])

  async function fetchMyApartmentId() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/users/me`, { headers })
    if (r.ok) {
      const me = await r.json()
      setMyApartmentId(me.apartmentId)
    }
  }

  async function fetchHouseholds() {
    const headers = { Authorization: `Bearer ${token}` }
    if (!myApartmentId) return
    const r = await fetch(`${apiBaseUrl}/api/apartments/${myApartmentId}/households`, { headers })
    if (r.ok) setHouseholds(await r.json())
  }

  async function fetchPendingUsers() {
    const headers = { Authorization: `Bearer ${token}` }
    const r = await fetch(`${apiBaseUrl}/api/users/pending`, { headers })
    if (r.ok) setPendingUsers(await r.json())
  }

  async function handleApproveUser(user) {
    setActionMsg('')
    setErrorMsg('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/users/${user.id}/approve`, {
        method: 'PUT',
        headers,
      })
      if (r.ok) {
        setActionMsg(`Approved resident account for ${user.name || user.email} (Flat ${user.flatNumber || 'Assigned'})!`)
        fetchPendingUsers()
        fetchHouseholds()
      } else {
        setErrorMsg('Failed to approve resident account.')
      }
    } catch {
      setErrorMsg('Error approving resident.')
    }
  }

  async function handleRejectUser(user) {
    if (!confirm(`Are you sure you want to REJECT registration for ${user.name || user.email}?`)) return
    setActionMsg('')
    setErrorMsg('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const r = await fetch(`${apiBaseUrl}/api/users/${user.id}/reject`, {
        method: 'PUT',
        headers,
      })
      if (r.ok) {
        setActionMsg(`Rejected and deleted registration request for ${user.email}.`)
        fetchPendingUsers()
        fetchHouseholds()
      } else {
        setErrorMsg('Failed to reject resident account.')
      }
    } catch {
      setErrorMsg('Error rejecting resident.')
    }
  }

  async function handleAddHousehold(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')
    try {
      if (!myApartmentId) throw new Error('Community not loaded')
      const r = await fetch(`${apiBaseUrl}/api/apartments/${myApartmentId}/households`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          flatNumber: flatNumber.trim().toUpperCase(),
          flatSizeSqft: parseInt(flatSizeSqft),
          occupancyCount: parseInt(occupancyCount),
          hasMeter,
        }),
      })
      if (r.ok) {
        setActionMsg(`Household Flat ${flatNumber} added!`)
        setShowForm(false)
        fetchHouseholds()
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Error adding household.')
      }
    } catch {
      setErrorMsg('Failed to add household.')
    }
  }

  async function handleDeleteHousehold(id) {
    if (!confirm('Are you sure you want to delete this household?')) return
    setActionMsg('')
    try {
      const r = await fetch(`${apiBaseUrl}/api/households/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (r.ok) {
        setActionMsg('Household deleted.')
        fetchHouseholds()
      }
    } catch {
      setErrorMsg('Error deleting household.')
    }
  }

  async function handleCreateResident(e) {
    e.preventDefault()
    setActionMsg('')
    setErrorMsg('')

    if (!myApartmentId) {
      setErrorMsg('Could not determine your community yet — please wait a moment and try again.')
      return
    }
    if (residentPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }

    try {
      const r = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          apartmentId: myApartmentId,
          name: residentName.trim(),
          email: residentEmail.trim().toLowerCase(),
          password: residentPassword,
          role: 'RESIDENT',
          flatNumber: residentFlatNumber.trim().toUpperCase(),
          occupancyCount: parseInt(residentOccupancy) || 3,
          flatSizeSqft: parseInt(residentFlatSize) || 1200,
        }),
      })
      if (r.ok) {
        setActionMsg(`Resident account created for ${residentEmail} (Flat ${residentFlatNumber.toUpperCase()}). They can log in immediately.`)
        setResidentName('')
        setResidentEmail('')
        setResidentPassword('')
        setResidentFlatNumber('')
        setResidentOccupancy('3')
        setResidentFlatSize('1200')
        setShowResidentForm(false)
        fetchHouseholds()
      } else {
        const body = await r.json().catch(() => null)
        setErrorMsg(body?.message || 'Could not create resident account. The email may already be in use.')
      }
    } catch {
      setErrorMsg('Failed to create resident account.')
    }
  }

  const filteredHouseholds = households.filter((h) =>
    h.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-sky-600" /> Household & Resident Directory
          </h2>
          <p className="text-xs text-slate-500">Manage flat numbers, floor area (sqft), meter installation status, and resident login accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search flat number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 pl-8 text-xs focus:outline-none"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
          <button
            onClick={() => setShowResidentForm(!showResidentForm)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 cursor-pointer"
          >
            <UserPlus size={16} /> Create Resident Account
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 cursor-pointer"
          >
            <Plus size={16} /> Add Household
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900 flex items-center gap-2">
          <ShieldAlert size={18} className="text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* CREATE RESIDENT ACCOUNT FORM */}
      {showResidentForm && (
        <form onSubmit={handleCreateResident} className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <KeyRound size={16} className="text-teal-600" /> Create Resident Login Account
          </h3>
          <p className="text-xs text-slate-500 -mt-2">
            Residents no longer self-register. Create their login here — the account is active immediately, no separate approval step needed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email (User ID)</label>
              <input
                type="email"
                required
                value={residentEmail}
                onChange={(e) => setResidentEmail(e.target.value)}
                placeholder="resident@apartment.com"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
              <input
                type="text"
                required
                minLength={8}
                value={residentPassword}
                onChange={(e) => setResidentPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Flat Number</label>
              <input
                type="text"
                required
                value={residentFlatNumber}
                onChange={(e) => setResidentFlatNumber(e.target.value)}
                placeholder="e.g. A-101"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Occupants Count</label>
              <input
                type="number"
                min="1"
                value={residentOccupancy}
                onChange={(e) => setResidentOccupancy(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Floor Area (sq.ft)</label>
              <input
                type="number"
                min="200"
                value={residentFlatSize}
                onChange={(e) => setResidentFlatSize(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-teal-800">
            If the flat number already exists, the resident will be linked to that existing household. Otherwise a new household record is created automatically.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowResidentForm(false)}
              className="rounded bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-teal-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer"
            >
              Create Resident Account
            </button>
          </div>
        </form>
      )}

      {/* LEGACY PENDING APPROVALS — kept for any older self-registered records; new residents skip this entirely */}
      {pendingUsers.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-amber-950 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-600" /> Legacy Pending Approvals
              </h3>
              <p className="text-xs text-amber-800">
                These are older self-registered accounts awaiting approval, from before resident accounts were admin-created.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-300">
              {pendingUsers.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg bg-white border border-amber-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-50/70 text-[11px] font-bold uppercase text-amber-900 border-b border-amber-200/60">
                <tr>
                  <th className="px-4 py-3">Resident Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Requested Flat</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-amber-50/30">
                    <td className="px-4 py-3 font-bold text-slate-900">{u.name || 'Resident User'}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-sky-100 text-sky-900 font-bold px-2 py-0.5 border border-sky-200">
                        Flat {u.flatNumber || 'Not Specified'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[10px] border border-amber-300">
                        PENDING APPROVAL
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleApproveUser(u)}
                        className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer transition-colors"
                      >
                        <UserCheck size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectUser(u)}
                        className="inline-flex items-center gap-1 rounded bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer transition-colors"
                      >
                        <UserX size={14} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ADD HOUSEHOLD FORM */}
      {showForm && (
        <form onSubmit={handleAddHousehold} className="rounded-xl border border-sky-200 bg-sky-50/50 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Add New Apartment Household</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Flat Number</label>
              <input
                type="text"
                required
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. C-301"
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Flat Size (sq.ft)</label>
              <input
                type="number"
                required
                value={flatSizeSqft}
                onChange={(e) => setFlatSizeSqft(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Occupants Count</label>
              <input
                type="number"
                required
                value={occupancyCount}
                onChange={(e) => setOccupancyCount(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="hasMeterCheck"
                checked={hasMeter}
                onChange={(e) => setHasMeter(e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded border-slate-300"
              />
              <label htmlFor="hasMeterCheck" className="text-xs font-bold text-slate-700">
                Metered Household
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
            >
              Save Household
            </button>
          </div>
        </form>
      )}

      {/* HOUSEHOLDS DIRECTORY TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Flat Number</th>
              <th className="px-4 py-3">Floor Area</th>
              <th className="px-4 py-3">Occupancy</th>
              <th className="px-4 py-3">Meter Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHouseholds.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-xs text-slate-500">
                  No households found.
                </td>
              </tr>
            ) : (
              filteredHouseholds.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">Flat {h.flatNumber}</td>
                  <td className="px-4 py-3">{h.flatSizeSqft} sq.ft</td>
                  <td className="px-4 py-3">{h.occupancyCount} Residents</td>
                  <td className="px-4 py-3">
                    {h.hasMeter ? (
                      <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                        METERED
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5">
                        UNMETERED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteHousehold(h.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer transition-colors p-1"
                      title="Delete Household"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
