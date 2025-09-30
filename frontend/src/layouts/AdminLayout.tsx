import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plane, Newspaper, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/flights', label: 'Flights', icon: Plane },
  { to: '/admin/news', label: 'News', icon: Newspaper },
]

const AdminLayout = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-600">Admin control</p>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage flights, news and platform content from this dashboard.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl bg-white p-4 shadow-sm">
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="rounded-2xl bg-white p-6 shadow-sm">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
