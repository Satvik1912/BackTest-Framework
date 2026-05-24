import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { loginAdmin } from "../api/auth"
import { useAuth } from "../context/AuthContext"
import AuthLayout from "../components/AuthLayout"

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { saveAuth } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    setLoading(true)
    try {
      const response = await loginAdmin(email, password)
      saveAuth(
        response.token,
        response.refreshToken,
        { userId: response.userId, email: response.email, role: response.role }
      )
      navigate("/admin")
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid email or password"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Admin sign in" subtitle="Access the Profit Life admin console" accent="slate">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="admin@example.com"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white py-2.5 px-4 rounded-lg font-semibold hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? "Signing in..." : "Sign in as admin"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        No admin account yet?{" "}
        <Link to="/admin/register" className="text-blue-600 hover:text-blue-700 font-medium">
          Create one
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        Regular user? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in here</Link>
      </p>
    </AuthLayout>
  )
}
