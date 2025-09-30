import { Link } from 'react-router-dom'
import { Search, TrendingUp, Shield, Clock, Plane, ArrowRight } from 'lucide-react'
import { useQuery } from 'react-query'
import FlightSearchForm from '../components/FlightSearchForm'
import NewsCard from '../components/NewsCard'
import { flightsApi, newsApi } from '../lib/api'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

interface PopularRoute {
  departure_code: string
  arrival_code: string
  departure_city: string
  arrival_city: string
  booking_count: number
  avg_price: number
}

const HomePage = () => {
  const {
    data: popularRoutes,
    isLoading: isLoadingRoutes,
    isError: isPopularError,
  } = useQuery('popularRoutes', async () => {
    const { data } = await flightsApi.getPopularRoutes()
    return data.data as PopularRoute[]
  })

  const {
    data: featuredNews,
    isLoading: isLoadingNews,
    isError: isNewsError,
  } = useQuery('featuredNews', async () => {
    const { data } = await newsApi.getFeatured()
    return data.data as Array<{
      id: number
      title: string
      slug: string
      summary: string
      published_at: string
      image_url?: string | null
    }>
  })

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold md:text-6xl">Book Your Perfect Flight</h1>
            <p className="mt-3 text-lg text-primary-100 md:text-xl">
              Search and compare flights from over 100 airlines worldwide
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-5xl">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Easy Search</h3>
            <p className="mt-2 text-sm text-gray-600">
              Find the best flights with filters for price, airlines and travel class.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Secure Booking</h3>
            <p className="mt-2 text-sm text-gray-600">
              Multiple payment gateways with encrypted transactions and 3D Secure.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">24/7 Support</h3>
            <p className="mt-2 text-sm text-gray-600">
              Our travel experts help you anytime via chat, email or phone.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Popular Routes</h2>
            <TrendingUp className="h-8 w-8 text-primary-600" />
          </div>
          <div className="mt-8">
            {isLoadingRoutes ? (
              <Loader />
            ) : isPopularError || !popularRoutes?.length ? (
              <EmptyState
                title="No popular routes yet"
                description="Start exploring our flight network to generate travel trends."
                icon={<Plane className="h-8 w-8" />}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popularRoutes.slice(0, 6).map((route) => (
                  <Link
                    key={`${route.departure_code}-${route.arrival_code}`}
                    to={`/flights?from=${route.departure_code}&to=${route.arrival_code}`}
                    className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{route.departure_code}</p>
                        <p className="text-sm text-gray-500">{route.departure_city}</p>
                      </div>
                      <div className="text-primary-500">
                        <ArrowRight className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{route.arrival_code}</p>
                        <p className="text-sm text-gray-500">{route.arrival_city}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                      <span>{route.booking_count} bookings</span>
                      <span className="font-semibold text-primary-600">
                        from ${Math.round(route.avg_price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Featured News</h2>
          <Link
            to="/news"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View all {'>'}
          </Link>
        </div>
        <div className="mt-8">
          {isLoadingNews ? (
            <Loader />
          ) : isNewsError || !featuredNews?.length ? (
            <EmptyState
              title="No articles yet"
              description="Check back soon for the latest travel news and promotions."
            />
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredNews.slice(0, 3).map((article) => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  slug={article.slug}
                  summary={article.summary}
                  publishedAt={article.published_at}
                  imageUrl={article.image_url ?? undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
