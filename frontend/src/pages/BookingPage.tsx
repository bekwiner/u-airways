import { FormEvent, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'react-query'
import toast from 'react-hot-toast'
import { bookingApi, flightsApi } from '../lib/api'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { formatCurrency, formatDateTime } from '../utils/format'

type PassengerInput = {
  fullName: string
  passportNumber: string
  seatClass: string
}

const defaultPassenger: PassengerInput = {
  fullName: '',
  passportNumber: '',
  seatClass: 'ECONOMY',
}

const seatClassOptions = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
]

const BookingPage = () => {
  const { flightId } = useParams()
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { ...defaultPassenger },
  ])
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')

  const { data: flight, isLoading, isError } = useQuery(['booking-flight', flightId], async () => {
    if (!flightId) return null
    const { data } = await flightsApi.getById(flightId)
    return data.data
  })

  const totalPrice = useMemo(() => {
    if (!flight?.priceFrom) return 0
    const multipliers: Record<string, number> = {
      ECONOMY: 1,
      BUSINESS: 2,
      FIRST: 3,
    }
    return passengers.reduce((sum, passenger) => {
      const multiplier = multipliers[passenger.seatClass] ?? 1
      return sum + flight.priceFrom * multiplier
    }, 0)
  }, [flight, passengers])

  const { mutate: createBooking, isLoading: isSubmitting } = useMutation(
    async () => {
      if (!flightId) throw new Error('Flight not found')
      const payload = {
        flightId: Number(flightId),
        contactEmail,
        contactPhone,
        paymentMethod,
        passengers: passengers.map((passenger) => ({
          full_name: passenger.fullName,
          passport_number: passenger.passportNumber,
          seat_class: passenger.seatClass,
        })),
      }
      const { data } = await bookingApi.create(payload)
      return data
    },
    {
      onSuccess: () => {
        toast.success('Booking confirmed! Check your dashboard for details.')
      },
      onError: () => {
        toast.error('Booking failed. Please try again later.')
      },
    },
  )

  const handleAddPassenger = () => {
    setPassengers((prev) => [...prev, { ...defaultPassenger }])
  }

  const handlePassengerChange = (
    index: number,
    field: keyof PassengerInput,
    value: string,
  ) => {
    setPassengers((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!passengers.every((p) => p.fullName && p.passportNumber)) {
      toast.error('Please complete passenger information')
      return
    }
    if (!contactEmail || !contactPhone) {
      toast.error('Add contact email and phone number')
      return
    }
    createBooking()
  }

  if (isLoading) {
    return <Loader />
  }

  if (isError || !flight) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <EmptyState
          title="Flight not available"
          description="The selected flight could not be found. Please search again."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[2fr_1fr]"
      >
        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Flight summary</h2>
            <div className="mt-6 rounded-2xl border border-gray-100 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">{flight.airline?.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{flight.code}</p>
                </div>
                <div className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600">
                  {formatCurrency(flight.priceFrom)} base fare
                </div>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Departure</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {flight.departureAirport.code} - {flight.departureAirport.city?.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{formatDateTime(flight.departureTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Arrival</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {flight.arrivalAirport.code} - {flight.arrivalAirport.city?.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{formatDateTime(flight.arrivalTime)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Passengers</h2>
              <button
                type="button"
                onClick={handleAddPassenger}
                className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
              >
                Add passenger
              </button>
            </div>
            <div className="mt-6 space-y-6">
              {passengers.map((passenger, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full name</label>
                      <input
                        type="text"
                        value={passenger.fullName}
                        onChange={(event) =>
                          handlePassengerChange(index, 'fullName', event.target.value)
                        }
                        placeholder="John Doe"
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Passport number</label>
                      <input
                        type="text"
                        value={passenger.passportNumber}
                        onChange={(event) =>
                          handlePassengerChange(index, 'passportNumber', event.target.value)
                        }
                        placeholder="AA1234567"
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Travel class</label>
                      <select
                        value={passenger.seatClass}
                        onChange={(event) =>
                          handlePassengerChange(index, 'seatClass', event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
                      >
                        {seatClassOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Contact details</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="john@example.com"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+998 90 000 00 00"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {['stripe', 'payme', 'click'].map((method) => (
                <label key={method} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="capitalize">{method}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 border-t border-gray-100 pt-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Passengers</span>
                <span>{passengers.length}</span>
              </div>
              <div className="mt-4 flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? 'Processing...' : 'Confirm booking'}
            </button>
          </section>

          <section className="rounded-3xl border border-primary-100 bg-primary-50 p-6 text-sm text-primary-700">
            <h3 className="text-lg font-semibold">Cancellation policy</h3>
            <p className="mt-3">
              Free cancellation within 24 hours. After that, a 10 percent fee applies.
            </p>
          </section>
        </aside>
      </form>
    </div>
  )
}

export default BookingPage
