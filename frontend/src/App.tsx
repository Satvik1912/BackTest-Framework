import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import HomePage from "./pages/HomePage"
import BackTestInfoPage from "./pages/BackTestInfoPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardLayout from "./pages/DashboardLayout"
import DashboardHome from "./pages/DashboardHome"
import StrategiesListPage from "./pages/StrategiesListPage"
import StrategyBuilder from "./pages/StrategyBuilder"
import JobsPage from "./pages/JobsPage"
import JobDetailPage from "./pages/JobDetailPage"
import AdminLoginPage from "./pages/AdminLoginPage"
import AdminRegisterPage from "./pages/AdminRegisterPage"
import AdminLayout from "./pages/AdminLayout"
import AdminHome from "./pages/AdminHome"
import AdminUsersPage from "./pages/AdminUsersPage"
import AdminUserStrategiesPage from "./pages/AdminUserStrategiesPage"
import AdminJobDetailPage from "./pages/AdminJobDetailPage"

function RootGate() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/dashboard"} replace />
  }

  return <HomePage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootGate />} />
          <Route path="/products/backtest" element={<BackTestInfoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="USER">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="strategies" element={<StrategiesListPage />} />
            <Route path="strategies/new" element={<StrategyBuilder />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:jobId" element={<JobDetailPage />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminHome />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId/strategies" element={<AdminUserStrategiesPage />} />
            <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
