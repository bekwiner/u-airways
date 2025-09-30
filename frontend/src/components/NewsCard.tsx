import { Link } from 'react-router-dom'
import { formatDate } from '../utils/format'

export type NewsCardProps = {
  id: number
  title: string
  slug: string
  summary: string
  publishedAt: string
  imageUrl?: string | null
}

const NewsCard = ({ id, title, slug, summary, publishedAt, imageUrl }: NewsCardProps) => {
  return (
    <Link
      to={`/news/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
      key={id}
    >
      {imageUrl ? (
        <div className="h-48 overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-primary-50 text-primary-500">
          <span className="text-lg font-semibold">Airways News</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs uppercase tracking-wide text-primary-600">
          {formatDate(publishedAt)}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900 group-hover:text-primary-600">
          {title}
        </h3>
        <p className="mt-3 text-sm text-gray-600">{summary}</p>
        <span className="mt-auto pt-4 text-sm font-semibold text-primary-600 group-hover:underline">
          Read more {'>'}
        </span>
      </div>
    </Link>
  )
}

export default NewsCard
