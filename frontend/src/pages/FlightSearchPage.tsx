import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import FlightCard from '../components/FlightCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { flightsApi } from '../lib/api'
import { formatCurrency } from '../utils/format'

type ApiFlight = {
  id?: number
  flight_number?: string
  code?: string
  airline?: { name?: string }
  departure?: { airport?: string; city?: string; time?: string }
  arrival?: { airport?: string; city?: string; time?: string }
  duration?: number | string
  price?: number | string
  priceFrom?: number | string
  available_seats?: number
  availableSeats?: number
}

type FlightSearchResult = {
  id: number
  code: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  duration: string
  priceFrom: number
  availableSeats: number
}

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes || Number.isNaN(minutes)) {
    return '--'
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.max(0, minutes % 60)
  return `${hours}h ${remainingMinutes}m`
}

const FlightSearchPage = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const queryKey = useMemo(() => ['flights', location.search], [location.search])

  const searchPayload = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries())
    const from = params.from?.trim()
    const to = params.to?.trim()
    const departureDate = params.departureDate

    if (!from || !to || !departureDate) {
      return null
    }

    const passengers = Number(params.passengers ?? '1')
    const classParam = params.seatClass?.trim().toLowerCase()
    const classToken = classParam
      ? `${classParam.charAt(0).toUpperCase()}${classParam.slice(1)}`
      : undefined

    return {
      departure_airport: from.toUpperCase(),
      arrival_airport: to.toUpperCase(),
      departure_date: departureDate,
      return_date: params.returnDate || undefined,
      adults: Number.isFinite(passengers) && passengers > 0 ? passengers : 1,
      class: classToken,
    }
  }, [searchParams])

  const {
    data: flights = [],
    isLoading,
    isError,
  } = useQuery(
    queryKey,
    async () => {
      const response = await flightsApi.search(searchPayload as Record<string, unknown>)
      const payload = Array.isArray(response.data?.data) ? response.data.data : []

      return payload.map((flight: ApiFlight): FlightSearchResult => {
        const durationMinutes = Number(flight?.duration ?? 0)
        const departureLabel = flight?.departure
          ? [flight.departure.airport ?? '', flight.departure.city ?? ''].filter(Boolean).join(' - ')
          : '--'
        const arrivalLabel = flight?.arrival
          ? [flight.arrival.airport ?? '', flight.arrival.city ?? ''].filter(Boolean).join(' - ')
          : '--'

        return {
          id: flight?.id ?? 0,
          code: flight?.flight_number ?? flight?.code ?? 'N/A',
          airline: flight?.airline?.name ?? 'Unknown Airline',
          departureAirport: departureLabel,
          arrivalAirport: arrivalLabel,
          departureTime: flight?.departure?.time ?? '',
          arrivalTime: flight?.arrival?.time ?? '',
          duration: formatDuration(durationMinutes),
          priceFrom: Number(flight?.price ?? flight?.priceFrom ?? 0),
          availableSeats: flight?.available_seats ?? flight?.availableSeats ?? 0,
        }
      })
    },
    {
      enabled: Boolean(searchPayload),
    },
  )

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const passengers = searchParams.get('passengers')
  const hasSearchCriteria = Boolean(searchPayload)

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flight Results</h1>
          <p className="mt-2 text-sm text-gray-600">
            Showing flight matches for your search. Prices are displayed per passenger.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          {from && to ? (
            <span>
              {from} to {to}
            </span>
          ) : (
            <span>All destinations</span>
          )}
          {passengers ? (
            <span className="ml-3 font-medium text-gray-700">{passengers} passengers</span>
          ) : null}
        </div>
      </div>

      {!hasSearchCriteria ? (
        <EmptyState
          title="Search for flights"
          description="Use the form on the homepage to choose your origin, destination and travel dates."
        />
      ) : isLoading ? (
        <Loader />
      ) : isError ? (
        <EmptyState
          title="Unable to load flights"
          description="Try adjusting your filters and search again."
        />
      ) : flights.length > 0 ? (
        <div className="space-y-6">
          {flights.map((flight) => (
            <FlightCard key={flight.id} {...flight} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No flights found"
          description="Try searching with different dates or choose another destination."
          icon={<span className="text-xl">:)</span>}
        />
      )}

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-10 text-white">
        <h2 className="text-2xl font-semibold">Need flexible travel plans?</h2>
        <p className="mt-2 max-w-2xl text-primary-100">
          Save up to 25 percent with our loyalty program. Earn points on every booking and redeem them for future trips, lounge access and upgrades starting from {formatCurrency(50)}.
        </p>
      </div>
    </div>
  )
}

export default FlightSearchPage




