import { useQuery } from 'react-query'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import DashboardStatCard from '../../components/DashboardStatCard'
import { adminApi } from '../../lib/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'

interface DashboardStats {
  totalUsers: number
  totalFlights: number
  totalBookings: number
  totalRevenue: number
  recentBookings: Array<{
    id: number
    reference: string
    amount: number
    createdAt: string
  }>
}

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError } = useQuery('admin-dashboard', async () => {
    const { data } = await adminApi.getDashboardStats()
    return data.data as DashboardStats
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14">
        <EmptyState title="Not authorized" description="You need admin access to view this page." />
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
          title="Unable to load dashboard"
          description="Please try again later."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-10 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary-600">Admin panel</p>
            <h1 className="text-3xl font-bold text-gray-900">Airways dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor platform performance and recent activity.
            </p>
          </div>
          <div className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600">
            Signed in as {user.full_name}
          </div>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-4">
          <DashboardStatCard title="Users" value={data.totalUsers} />
          <DashboardStatCard title="Flights" value={data.totalFlights} />
          <DashboardStatCard title="Bookings" value={data.totalBookings} />
          <DashboardStatCard title="Revenue" value={formatCurrency(data.totalRevenue)} />
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">Recent bookings</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
            {data.recentBookings.length === 0 ? (
              <EmptyState
                title="No bookings yet"
                description="New reservations will appear here."
              />
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {booking.reference}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(booking.amount)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(booking.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
