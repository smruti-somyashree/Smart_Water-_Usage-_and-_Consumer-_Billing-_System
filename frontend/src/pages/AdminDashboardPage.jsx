import { AlertTriangle, BarChart3, DollarSign, Droplets, FileText, Globe, Home, Layers, LogOut, Settings, Truck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AdminAlertsView from './admin/AdminAlertsView'
import AdminBillingCyclesView from './admin/AdminBillingCyclesView'
import AdminDashboardView from './admin/AdminDashboardView'
import AdminHouseholdsView from './admin/AdminHouseholdsView'
import AdminInvoicesView from './admin/AdminInvoicesView'
import AdminMeterReadingsView from './admin/AdminMeterReadingsView'
import AdminProcurementView from './admin/AdminProcurementView'
import AdminReportsView from './admin/AdminReportsView'
import AdminSettingsView from './admin/AdminSettingsView'
import AdminTariffsView from './admin/AdminTariffsView'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('smartwater.accessToken')

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Derive active tab from URL path
  const currentTab = location.pathname.replace('/admin/', '').replace('/admin', '') || 'dashboard'
  const [activeTab, setActiveTab] = useState(currentTab)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchMe()
  }, [token])

  useEffect(() => {
    const tab = location.pathname.replace('/admin/', '').replace('/admin', '') || 'dashboard'
    setActiveTab(tab)
  }, [location.pathname])

  async function fetchMe() {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const meRes = await fetch(`${apiBaseUrl}/api/users/me`, { headers })
      if (meRes.ok) {
        const u = await meRes.json()
        if (u.role !== 'ADMIN') {
          navigate('/access-denied', { replace: true })
          return
        }
        setUser(u)
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId)
    navigate(`/admin/${tabId}`)
  }

  function logout() {
    localStorage.removeItem('smartwater.accessToken')
    localStorage.removeItem('smartwater.refreshToken')
    navigate('/login')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'billing', label: 'Billing Cycles', icon: Layers },
    { id: 'tariffs', label: 'Tariffs', icon: DollarSign },
    { id: 'procurement', label: 'Water Procurement', icon: Truck },
    { id: 'households', label: 'Households', icon: Users },
    { id: 'readings', label: 'Meter Readings', icon: Droplets },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Admin Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between shrink-0">
        <div>
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 pb-6 border-b border-slate-100 cursor-pointer group"
            title="Go to SmartWater Home Page"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-600 text-white font-bold group-hover:scale-105 transition-transform">
              <Droplets size={20} />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 group-hover:text-sky-600 transition-colors">SmartWater</span>
              <span className="block text-[11px] font-bold text-sky-700 uppercase">ENTERPRISE ADMIN</span>
            </div>
          </div>

          {/* Admin Navigation Menu Items */}
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-bold border border-sky-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-sky-600' : 'text-slate-400'} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Home Page & Logout buttons */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 grid place-items-center text-xs font-bold text-slate-700 shrink-0">
              AD
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-slate-900 block truncate">{user?.email || 'admin@demo.local'}</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                Role: ADMIN
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 cursor-pointer transition-colors"
          >
            <Globe size={14} /> Go to Home Page
          </button>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area Rendering Dedicated View Component */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <AdminDashboardView onNavigate={handleTabChange} />}
        {activeTab === 'billing' && <AdminBillingCyclesView />}
        {activeTab === 'tariffs' && <AdminTariffsView />}
        {activeTab === 'procurement' && <AdminProcurementView />}
        {activeTab === 'households' && <AdminHouseholdsView />}
        {activeTab === 'readings' && <AdminMeterReadingsView />}
        {activeTab === 'alerts' && <AdminAlertsView />}
        {activeTab === 'invoices' && <AdminInvoicesView />}
        {activeTab === 'reports' && <AdminReportsView />}
        {activeTab === 'settings' && <AdminSettingsView />}
      </main>
    </div>
  )
}
