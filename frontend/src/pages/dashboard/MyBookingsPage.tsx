import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { bookingApi } from '../../lib/api'
import { formatCurrency, formatDateTime } from '../../utils/format'

interface BookingItem {
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

const MyBookingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams({ page: '1' })
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 10
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery(['bookings', page], async () => {
    const response = await bookingApi.getMyBookings({ page, limit })
    const payload = response.data?.data as
      | {
          bookings?: BookingItem[]
          pagination?: { total?: number; page?: number; limit?: number; pages?: number }
        }
      | undefined

    return {
      items: payload?.bookings ?? [],
      meta: {
        total: payload?.pagination?.total ?? 0,
        page: payload?.pagination?.page ?? page,
        pageSize: payload?.pagination?.limit ?? limit,
        totalPages: payload?.pagination?.pages ?? 1,
      },
    }
  })

  const cancelBookingMutation = useMutation(
    async (reference: string) => {
      await bookingApi.cancel(reference)
    },
    {
      onSuccess: () => {
        toast.success('Booking cancelled')
        queryClient.invalidateQueries('bookings')
      },
      onError: () => {
        toast.error('Unable to cancel booking')
      },
    },
  )

  const items = data?.items ?? []
  const total = data?.meta.total ?? 0
  const pageSize = data?.meta.pageSize ?? limit
  const totalPages = data?.meta.totalPages ?? Math.max(1, Math.ceil(total / pageSize))

  const handlePageChange = (nextPage: number) => {
    setSearchParams({ page: String(nextPage) })
  }

  if (isLoading) {
    return <Loader />
  }

  if (isError) {
    return <EmptyState title="Unable to load bookings" description="Please try again later." />
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">My bookings</h2>
      <p className="mt-1 text-sm text-gray-600">Manage your flight reservations.</p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No bookings found"
            description="Your confirmed flights will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Departure</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((booking) => (
                <tr key={booking.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                    {booking.reference}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {booking.flight.departureAirport.code} - {booking.flight.arrivalAirport.code}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(booking.flight.departureTime)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-primary-600">
                    {booking.status}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => cancelBookingMutation.mutate(booking.reference)}
                      className="text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between text-sm text-gray-600">
          <button
            className="rounded-lg border border-gray-200 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded-lg border border-gray-200 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default MyBookingsPage



