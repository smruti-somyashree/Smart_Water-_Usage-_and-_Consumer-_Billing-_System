import { Building2, LogOut, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082'
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('smartwater.accessToken')}`,
})

async function responseMessage(response, fallback) {
  const body = await response.json().catch(() => null)
  if (body?.fields) return Object.values(body.fields).join(' ')
  return body?.message || fallback
}

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate()
  const [communities, setCommunities] = useState([])
  const [communityAdmins, setCommunityAdmins] = useState([])
  const [residents, setResidents] = useState([])
  const [selectedResidentCommunity, setSelectedResidentCommunity] = useState('')
  const [community, setCommunity] = useState({ name: '', address: '', totalUnits: 1 })
  const [admin, setAdmin] = useState({ communityId: '', name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const communityNames = useMemo(() => new Map(communities.map((item) => [item.id, item.name])), [communities])
  const totalUnits = communities.reduce((count, item) => count + item.totalUnits, 0)
  const visibleResidents = useMemo(() => residents.filter((resident) => selectedResidentCommunity && resident.apartmentId === Number(selectedResidentCommunity)), [residents, selectedResidentCommunity])

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  const load = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const [communitiesResponse, usersResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/super-admin/communities`, { headers: authHeaders() }),
        fetch(`${apiBaseUrl}/api/users`, { headers: authHeaders() }),
      ])

      if (!communitiesResponse.ok) {
        if (communitiesResponse.status === 401 || communitiesResponse.status === 403) showMessage('Your session has expired. Please sign in again.', 'error')
        else showMessage(await responseMessage(communitiesResponse, 'Could not load communities.'), 'error')
        return
      }
      setCommunities(await communitiesResponse.json())

      if (usersResponse.ok) {
        const users = await usersResponse.json()
        setCommunityAdmins(users.filter((user) => user.role === 'COMMUNITY_ADMIN'))
        setResidents(users.filter((user) => user.role === 'RESIDENT'))
      } else {
        showMessage(await responseMessage(usersResponse, 'Could not load community administrators.'), 'error')
      }
    } catch {
      showMessage('Could not reach the server. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(true) }, [])

  async function createCommunity(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/super-admin/communities`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...community, totalUnits: Number(community.totalUnits) }),
      })
      if (!response.ok) return showMessage(await responseMessage(response, 'Could not create community.'), 'error')
      setCommunity({ name: '', address: '', totalUnits: 1 })
      showMessage('Community created.')
      await load()
    } catch {
      showMessage('Could not reach the server. Please try again.', 'error')
    } finally { setSubmitting(false) }
  }

  async function createAdmin(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const { communityId, ...adminDetails } = admin
      const response = await fetch(`${apiBaseUrl}/api/super-admin/communities/${communityId}/admins`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(adminDetails),
      })
      if (!response.ok) return showMessage(await responseMessage(response, 'Could not create community administrator.'), 'error')
      setAdmin({ communityId: '', name: '', email: '', password: '' })
      showMessage('Community administrator created. They can now sign in with the email and password provided.')
      await load()
    } catch {
      showMessage('Could not reach the server. Please try again.', 'error')
    } finally { setSubmitting(false) }
  }

  function prepareAdmin(communityId) {
    setAdmin({ communityId: String(communityId), name: '', email: '', password: '' })
    document.getElementById('community-admin-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function viewResidents(communityId) {
    setSelectedResidentCommunity(String(communityId))
    document.getElementById('residents-by-community')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function logout() {
    localStorage.removeItem('smartwater.accessToken')
    localStorage.removeItem('smartwater.refreshToken')
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-sky-700">SmartWater platform</p>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="mt-1 text-slate-600">Create and oversee every community and its administrators.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => load(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Refresh</button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-100"><LogOut size={17} /> Logout</button>
          </div>
        </header>

        {message && <p role="status" className={`mt-5 rounded-lg p-3 ${messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{message}</p>}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Building2} label="Communities" value={communities.length} detail="Configured communities" />
          <StatCard icon={Users} label="Community admins" value={communityAdmins.length} detail="Active platform administrators" />
          <StatCard icon={ShieldCheck} label="Configured units" value={totalUnits} detail="Across all communities" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <form className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={createCommunity}>
            <h2 className="text-lg font-semibold">Create community</h2>
            <p className="mt-1 text-sm text-slate-600">Add an apartment community to the platform.</p>
            <div className="mt-4 space-y-3">
              <input required placeholder="Community name" value={community.name} onChange={(event) => setCommunity({ ...community, name: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5" />
              <input required placeholder="Address" value={community.address} onChange={(event) => setCommunity({ ...community, address: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5" />
              <input required min="1" placeholder="Total units" type="number" value={community.totalUnits} onChange={(event) => setCommunity({ ...community, totalUnits: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5" />
            </div>
            <button disabled={submitting} className="mt-4 rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving…' : 'Create community'}</button>
          </form>

          <form id="community-admin-form" className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200" onSubmit={createAdmin}>
            <h2 className="text-lg font-semibold">Create community admin</h2>
            <p className="mt-1 text-sm text-slate-600">Assign an administrator to manage a specific community.</p>
            <div className="mt-4 space-y-3">
              <select required value={admin.communityId} onChange={(event) => setAdmin({ ...admin, communityId: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5"><option value="">Select community</option>{communities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <input required placeholder="Administrator name" value={admin.name} onChange={(event) => setAdmin({ ...admin, name: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5" />
              <input required type="email" placeholder="Email address" value={admin.email} onChange={(event) => setAdmin({ ...admin, email: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5" />
              <input required minLength="8" type="password" placeholder="Temporary password (8+ characters)" value={admin.password} onChange={(event) => setAdmin({ ...admin, password: event.target.value })} className="w-full rounded-lg border border-slate-300 p-2.5" />
            </div>
            <button disabled={submitting || communities.length === 0} className="mt-4 rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving…' : 'Create administrator'}</button>
          </form>
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Community administrators</h2><p className="mt-1 text-sm text-slate-600">All Community Admin accounts and their assigned communities.</p></div><span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">{communityAdmins.length} total</span></div>
          {loading ? <p className="py-8 text-center text-slate-500">Loading administrators…</p> : communityAdmins.length === 0 ? <p className="py-8 text-center text-slate-500">No community administrators have been created yet.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Administrator</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Community</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{communityAdmins.map((item) => <tr key={item.id}><td className="px-3 py-3 font-medium text-slate-900">{item.name || 'Community Administrator'}</td><td className="px-3 py-3 text-slate-600">{item.email}</td><td className="px-3 py-3">{communityNames.get(item.apartmentId) || 'Unassigned community'}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{item.status || 'APPROVED'}</span></td></tr>)}</tbody></table></div>}
        </section>

        <section id="residents-by-community" className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-lg font-semibold">Residents by community</h2><p className="mt-1 text-sm text-slate-600">Choose a community to view its resident accounts.</p></div>
            <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">Community</span><select value={selectedResidentCommunity} onChange={(event) => setSelectedResidentCommunity(event.target.value)} className="min-w-60 rounded-lg border border-slate-300 bg-white p-2.5"><option value="">Select community</option>{communities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          {!selectedResidentCommunity ? <p className="py-8 text-center text-slate-500">Select a community to see its residents.</p> : loading ? <p className="py-8 text-center text-slate-500">Loading residents…</p> : visibleResidents.length === 0 ? <p className="py-8 text-center text-slate-500">No resident accounts exist for this community yet.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Resident</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Flat</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleResidents.map((resident) => <tr key={resident.id}><td className="px-3 py-3 font-medium text-slate-900">{resident.name || 'Resident'}</td><td className="px-3 py-3 text-slate-600">{resident.email}</td><td className="px-3 py-3">{resident.flatNumber || '—'}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{resident.status || 'APPROVED'}</span></td></tr>)}</tbody></table></div>}
        </section>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div><h2 className="text-lg font-semibold">Communities</h2><p className="mt-1 text-sm text-slate-600">Platform communities and their administrator coverage.</p></div>
          {loading ? <p className="py-8 text-center text-slate-500">Loading communities…</p> : communities.length === 0 ? <p className="py-8 text-center text-slate-500">Create the first community to begin onboarding administrators.</p> : <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{communities.map((item) => { const count = communityAdmins.filter((user) => user.apartmentId === item.id).length; return <article key={item.id} className="rounded-lg border border-slate-200 p-4"><h3 className="font-semibold text-slate-900">{item.name}</h3><p className="mt-1 min-h-10 text-sm text-slate-600">{item.address}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Units</dt><dd className="font-semibold">{item.totalUnits}</dd></div><div><dt className="text-slate-500">Admins</dt><dd className="font-semibold">{count}</dd></div></dl><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => viewResidents(item.id)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100">View residents</button><button type="button" onClick={() => prepareAdmin(item.id)} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100">Add administrator</button></div></article> })}</div>}
        </section>
      </div>
    </main>
  )
}

function StatCard({ icon: Icon, label, value, detail }) {
  return <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{label}</span><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><Icon size={19} /></span></div><p className="mt-4 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>
}
