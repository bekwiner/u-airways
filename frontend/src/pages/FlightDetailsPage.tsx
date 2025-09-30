import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { flightsApi } from '../lib/api'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { formatCurrency, formatDateTime } from '../utils/format'
import { Plane, Clock, Users, Gauge, ShieldCheck } from 'lucide-react'

interface SeatGroup {
  classType: string
  available: number
  total: number
  price: number
}

interface FlightDetails {
  id: number
  code: string
  status: string
  departureAirport: {
    name: string
    code: string
    city: {
      name: string
      country: {
        name: string
      }
    }
  }
  arrivalAirport: {
    name: string
    code: string
    city: {
      name: string
      country: {
        name: string
      }
    }
  }
  departureTime: string
  arrivalTime: string
  duration: string
  airline: {
    name: string
    logoUrl?: string
  }
  plane: {
    model: string
    seats: number
  }
  seatGroups: SeatGroup[]
  priceFrom: number
  baggagePolicy?: string
  amenities?: string[]
}

const FlightDetailsPage = () => {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery(['flight', id], async () => {
    if (!id) return null
    const { data: response } = await flightsApi.getById(id)
    return response.data as FlightDetails
  })

  if (isLoading) {
    return <Loader />
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <EmptyState title="Flight not found" description="The flight you are looking for is unavailable or no longer exists." />
      </div>
    )
  }

  const seatGroups = data.seatGroups ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-8 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-primary-600">{data.airline.name}</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Flight {data.code}</h1>
              <p className="mt-2 text-sm text-gray-500">Status: {data.status}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {data.airline.logoUrl ? (
                <img src={data.airline.logoUrl} alt={data.airline.name} className="h-12" />
              ) : null}
              <div className="rounded-lg bg-primary-50 px-4 py-3 text-primary-600">
                From {formatCurrency(data.priceFrom)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-8 py-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Departure</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {data.departureAirport.code} - {data.departureAirport.city.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{data.departureAirport.city.country.name}</p>
                  <p className="mt-2 text-sm text-gray-500">{formatDateTime(data.departureTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Arrival</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {data.arrivalAirport.code} - {data.arrivalAirport.city.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{data.arrivalAirport.city.country.name}</p>
                  <p className="mt-2 text-sm text-gray-500">{formatDateTime(data.arrivalTime)}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-600" /> {data.duration}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary-600" /> {data.plane.model}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary-600" /> {data.plane.seats} seats total
                </span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Seat availability</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {seatGroups.length > 0 ? (
                  seatGroups.map((group) => (
                    <div
                      key={group.classType}
                      className="rounded-xl border border-primary-100 bg-primary-50 p-4"
                    >
                      <p className="text-sm font-medium text-primary-600">{group.classType}</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">{group.available} seats</p>
                      <p className="mt-1 text-sm text-gray-600">{group.total} total seats</p>
                      <p className="mt-2 text-sm font-semibold text-primary-600">
                        {formatCurrency(group.price)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Seat information will be available soon.</p>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Amenities</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {(data.amenities ?? ['In-flight entertainment', 'Complimentary meals', 'WiFi on board']).map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <ShieldCheck className="h-4 w-4 text-primary-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Plane details</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary-600" /> Model: {data.plane.model}
                </p>
                <p className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary-600" /> Seats: {data.plane.seats}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Baggage</h3>
              <p className="mt-2 text-sm text-gray-600">
                {data.baggagePolicy ?? 'Economy: 1 x 7kg cabin bag. Business and First: 2 x 32kg checked bags and 1 cabin bag.'}
              </p>
            </div>
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-6">
              <h3 className="text-lg font-semibold text-primary-700">Ready to book?</h3>
              <p className="mt-2 text-sm text-primary-700">
                Reserve your seat now and earn loyalty points on every booking.
              </p>
              <a
                href={`/booking/${data.id}`}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Continue to booking
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default FlightDetailsPage
