import { FormEvent, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import Loader from '../../components/Loader'
import { userApi } from '../../lib/api'

interface UserProfile {
  id: number
  full_name: string
  email: string
  phone?: string | null
  loyalty_program?: {
    level: string
    points: number
  }
}

const ProfilePage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery('profile', async () => {
    const { data } = await userApi.getProfile()
    return data.data as UserProfile
  })

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (data) {
      setFullName(data.full_name)
      setPhone(data.phone ?? '')
    }
  }, [data])

  const updateProfileMutation = useMutation(
    async () => {
      await userApi.updateProfile({ full_name: fullName, phone })
    },
    {
      onSuccess: () => {
        toast.success('Profile updated')
        queryClient.invalidateQueries('profile')
      },
      onError: () => {
        toast.error('Failed to update profile')
      },
    },
  )

  const changePasswordMutation = useMutation(
    async () => {
      await userApi.changePassword({ currentPassword, newPassword })
    },
    {
      onSuccess: () => {
        toast.success('Password changed')
        setCurrentPassword('')
        setNewPassword('')
      },
      onError: () => {
        toast.error('Unable to change password')
      },
    },
  )

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!fullName) {
      toast.error('Full name is required')
      return
    }
    updateProfileMutation.mutate()
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentPassword || !newPassword) {
      toast.error('Enter current and new password')
      return
    }
    changePasswordMutation.mutate()
  }

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile details</h2>
        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={data?.email ?? ''}
              disabled
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            disabled={updateProfileMutation.isLoading}
          >
            {updateProfileMutation.isLoading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            disabled={changePasswordMutation.isLoading}
          >
            {changePasswordMutation.isLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        {data?.loyalty_program ? (
          <div className="mt-10 rounded-xl border border-primary-100 bg-primary-50 p-5 text-sm text-primary-700">
            <p className="font-semibold">Loyalty level: {data.loyalty_program.level}</p>
            <p className="mt-1">Points: {data.loyalty_program.points}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default ProfilePage
