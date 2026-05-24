import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { UserRole } from "../types"

export default function ProtectedRoute({
  children,
  requiredRole
}: {
  children: React.ReactNode
  requiredRole?: UserRole
}) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const fallback = requiredRole === "ADMIN" ? "/admin/login" : "/login"
    return <Navigate to={fallback} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    const home = user?.role === "ADMIN" ? "/admin" : "/dashboard"
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
