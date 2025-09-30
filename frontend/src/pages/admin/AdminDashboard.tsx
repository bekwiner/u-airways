import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Users,
  Plane,
  Newspaper,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import DashboardStatCard from '../../components/DashboardStatCard'
import { adminApi } from '../../lib/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'

type StatsBlock = {
  total_users: number
  total_flights: number
  total_bookings: number
  total_revenue: number
}

type RawRecentBooking = {
  id: number
  booking_reference?: string | null
  total_price?: number | string | null
  created_at?: string | null
  user?: {
    full_name?: string | null
    email?: string | null
  } | null
  flight?: {
    flight_number?: string | null
    departure_airport?: { code?: string | null } | null
    arrival_airport?: { code?: string | null } | null
  } | null
}

type PopularRoute = {
  departure: string
  arrival: string
  bookings: number
}

type RecentBookingRow = {
  id: number
  reference: string
  amount: number
  createdAt: string
  customer: string
  route: string
}

type PopularRouteRow = {
  key: string
  departure: string
  arrival: string
  bookings: number
}

type AdminDashboardResponse = {
  stats?: StatsBlock
  recent_bookings?: RawRecentBooking[]
  popular_routes?: PopularRoute[]
}

const mapRecentBookings = (bookings: RawRecentBooking[] | undefined): RecentBookingRow[] =>
  (bookings ?? []).map((booking) => ({
    id: booking.id,
    reference: booking.booking_reference ?? 'N/A',
    amount: Number(booking.total_price ?? 0),
    createdAt: booking.created_at ?? '',
    customer:
      booking.user?.full_name ?? booking.user?.email ?? 'Unknown passenger',
    route:
      booking.flight?.departure_airport?.code && booking.flight?.arrival_airport?.code
        ? `${booking.flight.departure_airport.code} ➜ ${booking.flight.arrival_airport.code}`
        : booking.flight?.flight_number ?? '—',
  }))

const mapPopularRoutes = (routes: PopularRoute[] | undefined): PopularRouteRow[] =>
  (routes ?? []).map((route) => ({
    key: `${route.departure}-${route.arrival}`,
    departure: route.departure,
    arrival: route.arrival,
    bookings: Number(route.bookings ?? 0),
  }))

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user)

  const { data, isLoading, isError } = useQuery('admin-dashboard', async () => {
    const response = await adminApi.getDashboardStats()
    const payload = response.data?.data as AdminDashboardResponse | undefined
    return {
      stats: {
        total_users: payload?.stats?.total_users ?? 0,
        total_flights: payload?.stats?.total_flights ?? 0,
        total_bookings: payload?.stats?.total_bookings ?? 0,
        total_revenue: Number(payload?.stats?.total_revenue ?? 0),
      },
      recentBookings: mapRecentBookings(payload?.recent_bookings),
      popularRoutes: mapPopularRoutes(payload?.popular_routes),
    }
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14">
        <EmptyState
          title="Not authorized"
          description="You need elevated access to view the administration console."
        />
      </div>
    )
  }

  if (isLoading) {
    return <Loader />
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14">
        <EmptyState
          title="Unable to load analytics"
          description="Check your connection and try refreshing the dashboard."
        />
      </div>
    )
  }

  const { stats, recentBookings, popularRoutes } = data

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations control center</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor performance, review bookings, and jump into management tools.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600">
            Signed in as {user.full_name}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-primary-500" />
            {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Active users"
          value={stats.total_users.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <DashboardStatCard
          title="Scheduled flights"
          value={stats.total_flights.toLocaleString()}
          icon={<Plane className="h-5 w-5" />}
        />
        <DashboardStatCard
          title="Tickets issued"
          value={stats.total_bookings.toLocaleString()}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <DashboardStatCard
          title="Lifetime revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={<ArrowRight className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Latest bookings</h2>
            <Link
              to="/admin/flights"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Manage flights <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <EmptyState
              title="No recent bookings"
              description="New reservations will show up here as they come in."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Route / Flight</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {booking.reference}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {booking.customer}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {booking.route}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {formatCurrency(booking.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {booking.createdAt ? formatDateTime(booking.createdAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
            <Link
              to="/admin/news"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Manage news <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            <Link
              to="/admin/flights"
              className="flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              <span className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Flight schedule
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/news"
              className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              <span className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                News & announcements
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User directory
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Popular routes (30 days)</h3>
            {popularRoutes.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No route performance data yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {popularRoutes.map((route) => (
                  <li
                    key={route.key}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <span>
                      {`${route.departure} -> ${route.arrival}` }
                    </span>
                    <span className="font-semibold text-gray-900">{route.bookings}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard



