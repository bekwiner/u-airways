import { useState, ChangeEvent, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { adminApi } from '../../lib/api'

interface RawFlight {
  id: number
  flight_number: string
  status?: string
  is_active?: boolean
  base_price?: string | number
  departure_time?: string
  arrival_time?: string
  plane?: {
    id: number
    model?: string
    company?: { name?: string }
  }
  departure_airport?: {
    id: number
    code?: string
    city?: { name?: string }
  }
  arrival_airport?: {
    id: number
    code?: string
    city?: { name?: string }
  }
}

interface FlightRow {
  id: number
  code: string
  route: string
  airline: string
  departure: string
  arrival: string
  status: string
  active: boolean
  basePrice: number
  planeId: number
  departureAirportId: number
  arrivalAirportId: number
  departureTime: string
  arrivalTime: string
}

interface FlightFormState {
  flight_number: string
  plane_id: string
  departure_airport_id: string
  arrival_airport_id: string
  departure_time: string
  arrival_time: string
  base_price: string
  gate: string
  terminal: string
  is_active: boolean
}

const formatDateTimeLocal = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const mapFlight = (flight: RawFlight): FlightRow => {
  const departureCity = flight.departure_airport?.city?.name ?? ''
  const arrivalCity = flight.arrival_airport?.city?.name ?? ''
  const airline = flight.plane?.company?.name ?? 'Unknown'
  const route = `${flight.departure_airport?.code ?? '???'} ➜ ${flight.arrival_airport?.code ?? '???'}`

  return {
    id: flight.id,
    code: flight.flight_number,
    route,
    airline,
    departure: departureCity,
    arrival: arrivalCity,
    status: flight.status ?? 'SCHEDULED',
    active: flight.is_active ?? true,
    basePrice: Number(flight.base_price ?? 0),
    planeId: flight.plane?.id ?? 0,
    departureAirportId: flight.departure_airport?.id ?? 0,
    arrivalAirportId: flight.arrival_airport?.id ?? 0,
    departureTime: flight.departure_time ?? '',
    arrivalTime: flight.arrival_time ?? '',
  }
}

const emptyFlightForm: FlightFormState = {
  flight_number: '',
  plane_id: '',
  departure_airport_id: '',
  arrival_airport_id: '',
  departure_time: '',
  arrival_time: '',
  base_price: '',
  gate: '',
  terminal: '',
  is_active: true,
}

const FlightsAdminPage = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState<FlightFormState>(emptyFlightForm)

  const { data, isLoading, isError } = useQuery(
    ['admin-flights', page],
    async () => {
      const response = await adminApi.getFlights({ page, limit: 10 })
      const payload = response.data?.data as
        | {
            flights?: RawFlight[]
            pagination?: { page?: number; pages?: number; total?: number }
          }
        | undefined

      return {
        flights: (payload?.flights ?? []).map(mapFlight),
        pagination: {
          current: payload?.pagination?.page ?? page,
          totalPages: payload?.pagination?.pages ?? 1,
          totalRecords: payload?.pagination?.total ?? 0,
        },
      }
    },
    { keepPreviousData: true },
  )

  const createFlightMutation = useMutation((body: Record<string, unknown>) => adminApi.createFlight(body), {
    onSuccess: () => {
      toast.success('Flight created')
      queryClient.invalidateQueries('admin-flights')
      setFormState(emptyFlightForm)
    },
  })

  const updateFlightMutation = useMutation(
    ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      adminApi.updateFlight(id, body),
    {
      onSuccess: () => {
        toast.success('Flight updated')
        queryClient.invalidateQueries('admin-flights')
        setEditingId(null)
        setFormState(emptyFlightForm)
      },
    },
  )

  const deleteFlightMutation = useMutation((id: number) => adminApi.deleteFlight(id), {
    onSuccess: () => {
      toast.success('Flight deleted')
      queryClient.invalidateQueries('admin-flights')
    },
  })

  const cancelFlightMutation = useMutation((id: number) => adminApi.cancelFlight(id), {
    onSuccess: () => {
      toast.success('Flight cancelled')
      queryClient.invalidateQueries('admin-flights')
    },
  })

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type, checked } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEdit = (flight: FlightRow) => {
    setEditingId(flight.id)
    setFormState({
      flight_number: flight.code,
      plane_id: flight.planeId ? String(flight.planeId) : '',
      departure_airport_id: flight.departureAirportId ? String(flight.departureAirportId) : '',
      arrival_airport_id: flight.arrivalAirportId ? String(flight.arrivalAirportId) : '',
      departure_time: formatDateTimeLocal(flight.departureTime),
      arrival_time: formatDateTimeLocal(flight.arrivalTime),
      base_price: flight.basePrice ? String(flight.basePrice) : '',
      gate: '',
      terminal: '',
      is_active: flight.active,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormState(emptyFlightForm)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this flight?')) {
      deleteFlightMutation.mutate(id)
    }
  }

  const handleCancelFlight = (id: number) => {
    if (window.confirm('Cancel this flight and refund active bookings?')) {
      cancelFlightMutation.mutate(id)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.flight_number || !formState.departure_time || !formState.arrival_time) {
      toast.error('Flight number, departure and arrival times are required')
      return
    }

    const payload: Record<string, unknown> = {
      flight_number: formState.flight_number,
      plane_id: Number(formState.plane_id) || undefined,
      departure_airport_id: Number(formState.departure_airport_id) || undefined,
      arrival_airport_id: Number(formState.arrival_airport_id) || undefined,
      departure_time: new Date(formState.departure_time).toISOString(),
      arrival_time: new Date(formState.arrival_time).toISOString(),
      base_price: Number(formState.base_price) || 0,
      gate: formState.gate || undefined,
      terminal: formState.terminal || undefined,
      is_active: formState.is_active,
    }

    try {
      if (editingId) {
        await updateFlightMutation.mutateAsync({ id: editingId, body: payload })
      } else {
        await createFlightMutation.mutateAsync(payload)
      }
    } catch (error) {
      toast.error('Unable to save flight. Please review the form and try again.')
    }
  }

  const isBusy =
    createFlightMutation.isLoading ||
    updateFlightMutation.isLoading ||
    deleteFlightMutation.isLoading ||
    cancelFlightMutation.isLoading

  const flights = data?.flights ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage flights</h2>
          <p className="text-sm text-gray-500">
            Create, update or cancel scheduled flights. Use numeric IDs for plane and airports.
          </p>
        </div>
        {editingId && (
          <button
            onClick={handleCancelEdit}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel editing
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Flight number
            <input
              name="flight_number"
              value={formState.flight_number}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Plane ID
            <input
              name="plane_id"
              value={formState.plane_id}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="e.g. 1"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Base price
            <input
              type="number"
              min="0"
              step="0.01"
              name="base_price"
              value={formState.base_price}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Departure airport ID
            <input
              name="departure_airport_id"
              value={formState.departure_airport_id}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="e.g. 1"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Arrival airport ID
            <input
              name="arrival_airport_id"
              value={formState.arrival_airport_id}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="e.g. 2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="is_active"
              checked={formState.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            Active flight
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Departure time
            <input
              type="datetime-local"
              name="departure_time"
              value={formState.departure_time}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Arrival time
            <input
              type="datetime-local"
              name="arrival_time"
              value={formState.arrival_time}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Gate
            <input
              name="gate"
              value={formState.gate}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="Optional"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Terminal
            <input
              name="terminal"
              value={formState.terminal}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="Optional"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? 'Update flight' : 'Create flight'}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Scheduled flights</h3>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <EmptyState
            title="Unable to load flights"
            description="Please try again later."
          />
        ) : flights.length === 0 ? (
          <EmptyState
            title="No flights found"
            description="Create a flight to populate the schedule."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Route</th>
                  <th className="px-4 py-3 text-left">Airline</th>
                  <th className="px-4 py-3 text-left">Departure</th>
                  <th className="px-4 py-3 text-left">Arrival</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {flights.map((flight) => (
                  <tr key={flight.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{flight.code}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{flight.route}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{flight.airline}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Date(flight.departureTime).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Date(flight.arrivalTime).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">${flight.basePrice.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {flight.status}
                      {!flight.active && <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs">Inactive</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(flight)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCancelFlight(flight.id)}
                          className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(flight.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {pagination.current} of {pagination.totalPages}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default FlightsAdminPage




