import { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import HomePage from './pages/HomePage'
import FlightSearchPage from './pages/FlightSearchPage'
import FlightDetailsPage from './pages/FlightDetailsPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import MyBookingsPage from './pages/dashboard/MyBookingsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import NotFoundPage from './pages/NotFoundPage'

type GuardProps = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: GuardProps) => {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const AdminRoute = ({ children }: GuardProps) => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights" element={<FlightSearchPage />} />
        <Route path="/flights/:id" element={<FlightDetailsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/bookings" element={<MyBookingsPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/booking/:flightId" element={<BookingPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
