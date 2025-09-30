import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RefreshResponse = {
  data: {
    access_token: string
    refresh_token: string
  }
}

api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { refreshToken } = useAuthStore.getState()
        if (!refreshToken) {
          throw new Error('Missing refresh token')
        }
        const { data } = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const { access_token, refresh_token } = data.data
        const { user, setAuth } = useAuthStore.getState()
        if (user) {
          setAuth(user, access_token, refresh_token)
        }
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    const message = error.response?.data?.message || 'Something went wrong'
    toast.error(Array.isArray(message) ? message[0] : message)
    return Promise.reject(error)
  },
)

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (payload: Record<string, unknown>) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
}

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (payload: Record<string, unknown>) => api.put('/users/profile', payload),
  changePassword: (payload: Record<string, unknown>) => api.post('/users/change-password', payload),
  getStats: () => api.get('/users/stats'),
}

export const flightsApi = {
  search: (payload: Record<string, unknown>) => api.post('/flights/search', payload),
  getById: (id: number | string) => api.get(`/flights/${id}`),
  getPopularRoutes: () => api.get('/flights/popular-routes'),
}

export const bookingApi = {
  create: (payload: Record<string, unknown>) => api.post('/booking', payload),
  getMyBookings: (params: Record<string, unknown>) => api.get('/booking/my-bookings', { params }),
  getByReference: (reference: string) => api.get(`/booking/${reference}`),
  cancel: (reference: string) => api.delete(`/booking/${reference}`),
}

export const newsApi = {
  getAll: (params: Record<string, unknown>) => api.get('/news', { params }),
  getFeatured: () => api.get('/news/featured'),
  getBySlug: (slug: string) => api.get(`/news/slug/${slug}`),
  create: (payload: Record<string, unknown>) => api.post('/news', payload),
  update: (id: number | string, payload: Record<string, unknown>) => api.put(`/news/${id}`, payload),
  remove: (id: number | string) => api.delete(`/news/${id}`),
}

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params: Record<string, unknown>) => api.get('/admin/users', { params }),
  getFlights: (params: Record<string, unknown>) => api.get('/admin/flights', { params }),
  createFlight: (payload: Record<string, unknown>) => api.post('/admin/flights', payload),
  updateFlight: (id: number | string, payload: Record<string, unknown>) =>
    api.put(`/admin/flights/${id}`, payload),
  deleteFlight: (id: number | string) => api.delete(`/admin/flights/${id}`),
  cancelFlight: (id: number | string, payload?: Record<string, unknown>) =>
    api.post(`/admin/flights/${id}/cancel`, payload ?? {}),
  getBookings: (params: Record<string, unknown>) => api.get('/admin/bookings', { params }),
}

export const loyaltyApi = {
  getUserLoyalty: () => api.get('/loyalty'),
}

export const notificationApi = {
  getUserNotifications: (params: Record<string, unknown>) =>
    api.get('/notifications', { params }),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
}






