import { Navigate, Outlet } from 'react-router-dom'

export function AdminRoute() {
  const token = localStorage.getItem('smartwater.accessToken')
  let role = null

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      role = payload.role
    } catch {
      role = null
    }
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/access-denied" replace />
  }

  return <Outlet />
}

export function ResidentRoute() {
  const token = localStorage.getItem('smartwater.accessToken')
  let role = null

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      role = payload.role
    } catch {
      role = null
    }
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'RESIDENT') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}
