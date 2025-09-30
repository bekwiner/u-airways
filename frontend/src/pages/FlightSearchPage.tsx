import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import FlightCard from '../components/FlightCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { flightsApi } from '../lib/api'
import { formatCurrency } from '../utils/format'

interface SearchFlightDto {
  id: number
  code: string
  airline: {
    name: string
  }
  departureAirport: {
    code: string
    city: {
      name: string
    }
  }
  arrivalAirport: {
    code: string
    city: {
      name: string
    }
  }
  departureTime: string
  arrivalTime: string
  duration: string
  priceFrom: number
  availableSeats: number
}

const FlightSearchPage = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const queryKey = useMemo(() => ['flights', location.search], [location.search])

  const { data, isLoading, isError } = useQuery(queryKey, async () => {
    const params = Object.fromEntries(searchParams.entries())
    const { data: response } = await flightsApi.search(params)
    return response.data as SearchFlightDto[]
  })

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const passengers = searchParams.get('passengers')

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

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <EmptyState
          title="Unable to load flights"
          description="Try adjusting your filters and search again."
        />
      ) : data && data.length > 0 ? (
        <div className="space-y-6">
          {data.map((flight) => (
            <FlightCard
              key={flight.id}
              id={flight.id}
              code={flight.code}
              airline={flight.airline.name}
              departureAirport={`${flight.departureAirport.code} - ${flight.departureAirport.city.name}`}
              arrivalAirport={`${flight.arrivalAirport.code} - ${flight.arrivalAirport.city.name}`}
              departureTime={flight.departureTime}
              arrivalTime={flight.arrivalTime}
              duration={flight.duration}
              priceFrom={flight.priceFrom}
              availableSeats={flight.availableSeats}
            />
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
