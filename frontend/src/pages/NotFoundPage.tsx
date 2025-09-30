import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase text-primary-600">Error 404</p>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-3 text-sm text-gray-600">
          The page you are looking for could not be found. Please check the URL or return to the homepage.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
