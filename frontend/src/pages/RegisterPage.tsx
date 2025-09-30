import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const RegisterPage = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { mutate: register, isLoading } = useMutation(
    async () => {
      const payload = {
        full_name: fullName,
        email,
        password,
      }
      const { data } = await authApi.register(payload)
      return data
    },
    {
      onSuccess: (response) => {
        const { user, access_token, refresh_token } = response.data
        setAuth(user, access_token, refresh_token)
        toast.success('Account created successfully!')
        navigate('/dashboard')
      },
      onError: (_error: unknown) => {
        // console.error(_error)
        toast.error('Registration failed. Check your details and try again.')
      },
    },
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!fullName || !email || !password) {
      toast.error('All fields are required')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    register()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">Join Airways and unlock loyalty rewards.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
            placeholder="John Doe"
            required
          />
        </div>
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
        <div>
          <label className="text-sm font-medium text-gray-700">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600">
          Login here
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
