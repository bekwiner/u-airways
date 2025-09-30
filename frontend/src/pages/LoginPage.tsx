import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const LoginPage = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { mutate: login, isLoading } = useMutation(
    async () => {
      const { data } = await authApi.login(email, password)
      return data
    },
    {
      onSuccess: (response) => {
        const { user, access_token, refresh_token } = response.data
        setAuth(user, access_token, refresh_token)
        toast.success('Welcome back!')
        navigate('/dashboard')
      },
      onError: () => {
        toast.error('Invalid credentials, please try again.')
      },
    },
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }
    login()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Login to Airways</h1>
      <p className="mt-2 text-sm text-gray-600">Access your bookings, loyalty and more.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="john@example.com"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Do not have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-600">
          Create one now
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
