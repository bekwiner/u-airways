import { Link } from 'react-router-dom'
import { formatCurrency, formatDateTime } from '../utils/format'
import { Plane, Clock, Users } from 'lucide-react'

export type FlightCardProps = {
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

const FlightCard = ({
  id,
  code,
  airline,
  departureAirport,
  arrivalAirport,
  departureTime,
  arrivalTime,
  duration,
  priceFrom,
  availableSeats,
}: FlightCardProps) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm text-primary-600">
            <Plane className="h-4 w-4" />
            <span className="font-semibold">{code}</span>
            <span className="text-gray-400">-</span>
            <span>{airline}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-6 text-gray-900">
            <div>
              <p className="text-2xl font-bold">{departureAirport}</p>
              <p className="text-sm text-gray-500">{formatDateTime(departureTime)}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{arrivalAirport}</p>
              <p className="text-sm text-gray-500">{formatDateTime(arrivalTime)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {duration}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {availableSeats} seats left
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">From</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(priceFrom)}</p>
          </div>
          <Link
            to={`/booking/${id}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Book Now
          </Link>
          <Link
            to={`/flights/${id}`}
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FlightCard
