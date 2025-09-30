import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, ArrowLeftRight } from 'lucide-react'

const initialState = {
  from: '',
  to: '',
  departureDate: '',
  returnDate: '',
  passengers: 1,
  seatClass: 'ECONOMY',
}

const FlightSearchForm = () => {
  const [form, setForm] = useState(initialState)
  const navigate = useNavigate()

  const handleChange = (
    event: FormEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.currentTarget
    setForm((prev) => ({
      ...prev,
      [name]: name === 'passengers' ? Number(value) : value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (form.from) params.set('from', form.from)
    if (form.to) params.set('to', form.to)
    if (form.departureDate) params.set('departureDate', form.departureDate)
    if (form.returnDate) params.set('returnDate', form.returnDate)
    params.set('passengers', String(form.passengers))
    params.set('seatClass', form.seatClass)
    navigate(`/flights?${params.toString()}`)
  }

  const handleSwap = () => {
    setForm((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-xl md:p-8"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-3">
          <label className="text-sm font-medium text-black">From</label>
          <div className="mt-2 flex items-center space-x-3 rounded-lg border border-gray-200 px-3 py-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            <input
              color="blue"
              type="text"
              name="from"
              value={form.from}
              onChange={handleChange}
              placeholder="TAS"
              className="w-full bg-transparent focus:outline-none text-black"
              required
            />
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-center">
          <button
            type="button"
            onClick={handleSwap}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-primary-600 hover:bg-primary-50"
            aria-label="Swap origin and destination"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>
        </div>

        <div className="md:col-span-3">
          <label className="text-sm font-medium text-black">To</label>
          <div className="mt-2 flex items-center space-x-3 rounded-lg border border-gray-200 px-3 py-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            <input
              type="text"
              name="to"
              value={form.to}
              onChange={handleChange}
              placeholder="IST"
              className="w-full bg-transparent focus:outline-none text-black"
              required
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-black">Departure</label>
          <div className="mt-2 flex items-center space-x-3 rounded-lg border border-gray-200 px-3 py-2">
            <Calendar className="h-5 w-5 text-black" />
            <input
              type="date"
              name="departureDate"
              value={form.departureDate}
              onChange={handleChange}
              className="w-full bg-white focus:outline-none text-black"
              required
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-black">Return</label>
          <div className="mt-2 flex items-center space-x-3 rounded-lg border border-gray-200 px-3 py-2">
            <Calendar className="h-5 w-5 text-black" />
            <input
              type="date"
              name="returnDate"
              value={form.returnDate}
              onChange={handleChange}
              className="w-full bg-white focus:outline-none text-black"
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <label className="text-sm font-medium text-black">Passengers</label>
          <div className="mt-2 flex items-center space-x-3 rounded-lg border border-gray-200 px-3 py-2 bg-white">
            <Users className="h-5 w-5 text-black" />
            <input
              type="number"
              name="passengers"
              min={1}
              max={9}
              value={form.passengers}
              onChange={handleChange}
              className="w-full bg-white focus:outline-none text-black"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-black">Class</label>
          <select
            name="seatClass"
            value={form.seatClass}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, seatClass: event.target.value }))
            }
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none text-black bg-white"
          >
            <option value="ECONOMY">Economy</option>
            <option value="BUSINESS">Business</option>
            <option value="FIRST">First</option>
          </select>
        </div>

        <div className="md:col-span-12 flex justify-end">
          <button
            type="submit"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-primary-700"
          >
            Search Flights
          </button>
        </div>
      </div>
    </form>
  )
}

export default FlightSearchForm
