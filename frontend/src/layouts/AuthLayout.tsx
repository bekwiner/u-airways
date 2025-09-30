import { Outlet, Link } from 'react-router-dom'
import { Plane } from 'lucide-react'

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center space-x-2">
          <Plane className="h-7 w-7 text-primary-600" />
          <span className="text-xl font-semibold text-gray-900">Airways</span>
        </Link>
        <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Back to home
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
