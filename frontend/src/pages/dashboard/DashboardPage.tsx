import { useQuery } from 'react-query'
import DashboardStatCard from '../../components/DashboardStatCard'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { bookingApi, loyaltyApi, notificationApi, userApi } from '../../lib/api'
import { formatCurrency, formatDateTime } from '../../utils/format'

type BookingItem = {
  id: number
  reference: string
  status: string
  totalAmount: number
  createdAt: string
  flight: {
    code: string
    departureAirport: { code: string }
    arrivalAirport: { code: string }
    departureTime: string
  }
}

type NotificationItem = {
  id: number
  title: string
  body: string
  created_at: string
  is_read: boolean
}

const DashboardPage = () => {
  const { data: statsData, isLoading: isStatsLoading } = useQuery('user-stats', async () => {
    const { data } = await userApi.getStats()
    return data.data as {
      totalBookings: number
      totalSpent: number
      loyaltyPoints: number
    }
  })

  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery('dashboard-bookings', async () => {
    const { data } = await bookingApi.getMyBookings({ page: 1, limit: 5 })
    return data.data as { items: BookingItem[] }
  })

  const { data: loyaltyData, isLoading: isLoyaltyLoading } = useQuery('loyalty', async () => {
    const { data } = await loyaltyApi.getUserLoyalty()
    return data.data as { level: string; points: number; nextLevelAt: number }
  })

  const { data: notificationsData } = useQuery('notifications', async () => {
    const { data } = await notificationApi.getUserNotifications({ page: 1, limit: 5 })
    return data.data as { items: NotificationItem[] }
  })

  const upcomingBookings = bookingsData?.items ?? []
  const notifications = notificationsData?.items ?? []

  const isBusy = isStatsLoading || isBookingsLoading || isLoyaltyLoading

  if (isBusy) {
    return <Loader />
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Total bookings"
          value={statsData?.totalBookings ?? 0}
          change="+12% vs last month"
        />
        <DashboardStatCard
          title="Total spent"
          value={statsData ? formatCurrency(statsData.totalSpent) : formatCurrency(0)}
          change="Includes taxes and fees"
        />
        <DashboardStatCard
          title="Loyalty points"
          value={statsData?.loyaltyPoints ?? 0}
          change={loyaltyData ? `Level ${loyaltyData.level}` : 'Level Bronze'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming trips</h2>
            <span className="text-sm text-primary-600">View all</span>
          </div>
          <div className="mt-6 space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{booking.reference}</span>
                    <span className="font-semibold text-primary-600">{booking.status}</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {booking.flight.departureAirport.code} to {booking.flight.arrivalAirport.code}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatDateTime(booking.flight.departureTime)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No bookings yet"
                description="Start exploring flights and book your first trip."
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Loyalty overview</h2>
            {loyaltyData ? (
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>
                  Level: <span className="font-semibold text-primary-600">{loyaltyData.level}</span>
                </p>
                <p>
                  Points: <span className="font-semibold text-primary-600">{loyaltyData.points}</span>
                </p>
                <p>Next level at: {loyaltyData.nextLevelAt} points</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">Join the loyalty program to start earning points.</p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <div className="mt-4 space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border border-gray-100 px-4 py-3 text-sm ${
                      notification.is_read ? 'bg-white' : 'bg-primary-50'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-gray-600">{notification.body}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No notifications"
                  description="You are all caught up."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
