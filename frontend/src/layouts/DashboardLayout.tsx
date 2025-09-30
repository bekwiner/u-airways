import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Home, Plane, User, LogOut, Calendar, CreditCard } from 'lucide-react'

const dashboardLinks = [
  { to: '/dashboard', label: 'Overview', icon: Home },
  { to: '/dashboard/bookings', label: 'My Bookings', icon: Plane },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
]

const DashboardLayout = () => {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your bookings, profile, loyalty and notifications in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
              <Calendar className="h-4 w-4 text-primary-600" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
              <CreditCard className="h-4 w-4 text-primary-600" />
              <span>{user?.role}</span>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="rounded-2xl bg-white p-4 shadow-sm">
            <nav className="space-y-1">
              {dashboardLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </nav>
          </aside>
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
