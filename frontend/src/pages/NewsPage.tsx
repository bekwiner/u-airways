import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import NewsCard from '../components/NewsCard'
import { newsApi } from '../lib/api'

interface NewsItem {
  id: number
  title: string
  slug: string
  summary: string
  published_at: string
  image_url?: string | null
}

const NewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams({ page: '1' })
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 9

  const { data, isLoading, isError } = useQuery(['news', page], async () => {
    const response = await newsApi.getAll({ page, limit })
    const payload = response.data?.data as
      | {
          news?: NewsItem[]
          pagination?: { total?: number; page?: number; limit?: number; pages?: number }
        }
      | undefined

    return {
      items: payload?.news ?? [],
      meta: {
        total: payload?.pagination?.total ?? 0,
        page: payload?.pagination?.page ?? page,
        pageSize: payload?.pagination?.limit ?? limit,
        totalPages: payload?.pagination?.pages ?? 1,
      },
    }
  })

  const items = data?.items ?? []
  const total = data?.meta.total ?? 0
  const pageSize = data?.meta.pageSize ?? limit
  const totalPages = data?.meta.totalPages ?? Math.max(1, Math.ceil(total / pageSize))

  const handlePageChange = (nextPage: number) => {
    setSearchParams({ page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel news</h1>
          <p className="mt-2 text-sm text-gray-600">
            Stay updated with the latest announcements, promotions and travel tips.
          </p>
        </div>
        <Link to="/" className="text-sm font-semibold text-primary-600">
          Back to home
        </Link>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError || items.length === 0 ? (
        <EmptyState
          title="No news available"
          description="Check back later for updates from our airline partners."
        />
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
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

      {totalPages > 1 ? (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
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

export default NewsPage

