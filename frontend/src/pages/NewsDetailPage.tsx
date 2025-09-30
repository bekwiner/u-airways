import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { newsApi } from '../lib/api'
import { formatDate } from '../utils/format'

interface NewsDetails {
  id: number
  title: string
  slug: string
  content: string
  summary: string
  published_at: string
  image_url?: string | null
  author?: string | null
}

const NewsDetailPage = () => {
  const { slug } = useParams()

  const { data, isLoading, isError } = useQuery(['news', slug], async () => {
    if (!slug) return null
    const { data } = await newsApi.getBySlug(slug)
    return data.data as NewsDetails
  })

  if (isLoading) {
    return <Loader />
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <EmptyState
          title="Article not found"
          description="The news article you are looking for does not exist."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <Link to="/news" className="text-sm font-semibold text-primary-600">
        Back to news
      </Link>
      <article className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-xs uppercase tracking-wide text-primary-600">
          {formatDate(data.published_at)}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{data.title}</h1>
        {data.author ? (
          <p className="mt-2 text-sm text-gray-500">By {data.author}</p>
        ) : null}
        {data.image_url ? (
          <div className="mt-6 overflow-hidden rounded-2xl">
            <img src={data.image_url} alt={data.title} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="prose prose-lg mt-6 max-w-none text-gray-800">
          {data.content?.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  )
}

export default NewsDetailPage
